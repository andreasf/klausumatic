from django.http import HttpResponse
from models import Exam, ExamFile, Professor, Subject, Degree
from django.shortcuts import get_object_or_404, render_to_response
from django.conf import settings
import os.path
import cjson
import shlex
import subprocess
from django.views.decorators.csrf import csrf_exempt
from django import forms
from django.template import RequestContext
import hashlib
import logging
from django.db import IntegrityError
import os
import re

logger = logging.getLogger(__name__)

def list_untagged(request):
    """returns a list of all untagged files."""
    unt_obj = ExamFile.objects.filter(exam__isnull=True)
    unt_list = []
    for obj in unt_obj:
        d = {
            "id": obj.id,
            "name": os.path.split(obj.path.path)[1],
        }
        unt_list.append(d)
    json = cjson.encode(unt_list)
    return HttpResponse(content=json, mimetype='application/json')


def image(request, ef_id):
    """returns a png rendering of the first pdf page."""
    ef = get_object_or_404(ExamFile, id=ef_id)
    thumb = get_thumbnail_path(ef)
    daimage = file(thumb, 'rb').read()
    return HttpResponse(content=daimage, mimetype='image/png')

def get_thumbnail_path(examfile):
    """returns the path to the PNG version of the first page of
    an exam. if the PNG doesn't exist yet, it is created using
    mudraw from mupdf."""
    h = examfile.hash
    thumb = os.path.join(settings.MEDIA_ROOT, "cache", h + ".png")
    if os.path.exists(thumb):
        return thumb
    path = os.path.join(settings.MEDIA_ROOT, examfile.path.path)
    cmd = "/usr/local/bin/mudraw -o %s -h 800 -w 600 '%s' 1" % (thumb, path)
    args = shlex.split(cmd.encode("utf8"))
    mudraw = subprocess.Popen(args)
    mudraw.wait()
    return thumb

def download(request, ef_id):
    """sends an exam to the browser."""
    ef = get_object_or_404(ExamFile, id=ef_id)
    path = os.path.join(settings.MEDIA_ROOT, ef.path.path)
    response= HttpResponse(content=file(path, 'rb').read(), 
        mimetype='application/pdf')
    # fn = os.path.split(ef.path.path)[1]
    # response['Content-Disposition'] = "attachment; filename=%s" % (fn)
    return response

def file_switch(request, ef_id):
    if request.method == "GET":
        return download(request, ef_id)

def get_metadata(request, ef_id):
    """returns the metadata for a file"""
    ef = get_object_or_404(ExamFile, id=ef_id)
    try:
        e = Exam.objects.get(file=ef)
    except Exam.DoesNotExist:
        e = Exam()
    return HttpResponse(content=cjson.encode(e.serialize()),
        mimetype="application/json")

@csrf_exempt
def metadata_switch(request, ef_id):
    if request.method == "GET":
        return get_metadata(request, ef_id)
    if request.method == "POST":
        return post_metadata(request, ef_id)
    
@csrf_exempt
def post_metadata(request, ef_id):
    ef = get_object_or_404(ExamFile, id=ef_id)
    try:
        e = Exam.objects.get(file=ef)
    except Exam.DoesNotExist:
        e = Exam()
        e.file = ef
    e.professor, c = Professor.objects.get_or_create(name=request.POST['professor'])
    e.subject, c = Subject.objects.get_or_create(name=request.POST['subject'])
    e.degree, c = Degree.objects.get_or_create(name=request.POST['degree'])
    e.year = int(request.POST['year'])
    e.hws = True if request.POST['hws'] == "true" else False 
    e.solution = True if request.POST['solution'] == "true" else False 
    e.note = request.POST['note'] 
    e.save()
    return HttpResponse("OK")

def get_professors(request):
    profs = Professor.objects.all()
    p = list()
    for prof in profs:
        p.append(prof.name)
    return HttpResponse(content=cjson.encode(p), mimetype="application/json")

def get_subjects(request):
    subs = Subject.objects.all()
    s = list()
    for sub in subs:
        s.append(sub.name)
    return HttpResponse(content=cjson.encode(s), mimetype="application/json")

def get_degrees(request):
    degs = Degree.objects.all()
    d = list()
    for deg in degs:
        d.append(deg.name)
    return HttpResponse(content=cjson.encode(d), mimetype="application/json")

class UploadForm(forms.Form):
    file = forms.FileField()

def store_exam_file(uploaded_file):
    fn = secure_filename(uploaded_file.name)
    full_path = os.path.join(settings.MEDIA_ROOT, "exams", fn)
    count = 2
    while os.path.exists(full_path):
        full_path = os.path.join(settings.MEDIA_ROOT, "exams", fn + "_" + str(count))
        count = count + 1
    f = open(full_path, 'wb')
    f.write(uploaded_file.read())
    f.close()
    return full_path

    def secure_filename(path):
        _split = re.compile(r'[\0%s]' % re.escape(''.join(
            [os.path.sep, os.path.altsep or ''])))
        return _split.sub('', path)


@csrf_exempt
def post_file(request):
    if request.method == "POST":
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            delete_files_without_hash()
            fn = store_exam_file(request.FILES['file'])
            ef = ExamFile()
            ef.path = fn
            ef.upload_user = request.user.username
            try:
                ef.save()
            except IntegrityError:
                os.remove(fn)
                return HttpResponse("DUPLICATE")
            logger.info("HELLOES")
            logger.info(ef.pk)
            return HttpResponse("OK")
        else:
            r = HttpResponse("Invalid form")
            r.status_code = 406
            return r
    else:
        r = HttpResponse("GET not allowed")
        r.status_code = 405
        return r

def delete_files_without_hash():
    try:
        f = ExamFile.objects.get(hash="")
        f.delete()
    except ExamFile.DoesNotExist:
        pass

def klausumatic(request):
    context = {
        'STATIC_URL': settings.STATIC_URL,
    }
    return render_to_response('exams/klausumatic.html',
        context, context_instance=RequestContext(request))
