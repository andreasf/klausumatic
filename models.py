#!/usr/bin/python
# coding=utf8
from django.db import models
from django.dispatch import receiver
import hashlib
from django.conf import settings
import os.path
import shutil
import logging

logger = logging.getLogger(__name__)

class ExamFile(models.Model):
    path = models.FileField(upload_to="exams")
    hash = models.CharField(max_length=64, unique=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    upload_user = models.CharField(max_length=127)

    def __unicode__(self):
        return self.path.path

class Professor(models.Model):
    name = models.CharField(max_length=127, unique=True)

    def __unicode__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Subject(models.Model):
    name = models.CharField(max_length=255, unique=True)
    abbreviation = models.CharField(max_length=16, unique=True)

    def __unicode__(self):
        return "[%s] %s" % (self.abbreviation, self.name)

    def save(self, *args, **kwargs):
        """remove spaces from abbreviation before saving."""
        if self.abbreviation == "":
            self.abbreviation = self.name[0:16]
            self.abbreviation = self.abbreviation.replace(" ", "")
            i=0
            while Subject.objects.filter(abbreviation=self.abbreviation).count() > 0 and i < 100:
                self.abbreviation = self.abbreviation[0:14] + str(i)
        super(Subject, self).save(*args, **kwargs)

    class Meta:
        ordering = ['name']

class Degree(models.Model):
    name = models.CharField(max_length=127, unique=True)

    def __unicode__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Exam(models.Model):
    subject = models.ForeignKey(Subject)
    degree = models.ForeignKey(Degree)
    professor = models.ForeignKey(Professor)
    file = models.OneToOneField(ExamFile)
    year = models.IntegerField()
    hws = models.BooleanField()
    note = models.CharField(max_length=63, null=True, blank=True)
    solution = models.BooleanField()


    def replace_umlauts(self, str):
        str = str.replace(u"ö", "oe")
        str = str.replace(u"ü", "ue")
        str = str.replace(u"ä", "ae")
        str = str.replace(u"ß", "ss")
        str = str.replace(u"Ä", "Ae")
        str = str.replace(u"Ö", "Oe")
        str = str.replace(u"Ü", "Ue")
        str = str.replace(" ", "_")
        return str.lower()

    def encode_filename(self):
        sem = "hws" if self.hws else "fss"
        sem = sem + str(self.year)
        sol = "_ml" if self.solution else ""
        note = ("_" + self.note) if self.note != "" else ""
        fn = "%s_%s_%s_%s%s%s" % (self.subject.abbreviation, self.degree, 
            self.professor, sem, sol, note)
        return self.replace_umlauts(fn)

    def enforce_filename(self):
        fn = self.encode_filename() + ".pdf"
        path = self.file.path.path
        if os.path.split(path)[1] != fn:
            newpath = os.path.join(os.path.split(path)[0], fn)
            if os.path.exists(newpath):
                msg = "Cannot rename %s to %s: file exists already." % (path, newpath)
                logger.error(msg)
                return msg
            else:
                shutil.move(path, newpath)
                self.file.path = newpath
                self.file.save()
                logger.info("Exam file renamed: %s -> %s" % (path, newpath))

    def __unicode__(self):
        return self.encode_filename()

    def serialize(self):
        m = dict()
        m['professor'] = "" if self.professor_id is None else self.professor.name
        m['degree'] = "" if self.degree_id is None else self.degree.name
        m['subject'] = "" if self.subject_id is None else self.subject.name
        m['year'] = "" if self.year is None else self.year
        m['hws'] = True if self.hws is None else self.hws
        m['note'] = "" if self.note is None else self.note
        m['solution'] = False if self.solution is None else self.solution
        return m

class Klausumatic(Exam):
    class Meta:
        proxy = True
        verbose_name = "Klausumatic 3000"
        verbose_name_plural = "Klausumatic 3000"

@receiver(models.signals.post_save, sender=ExamFile)
def add_hash(sender, **kwargs):
    """adds a sha256 hash to an uploaded file."""
    ef = kwargs['instance']
    m = hashlib.new("sha256")
    ef_path = os.path.join(settings.MEDIA_ROOT, ef.path.path)
    ef_file = file(ef_path)
    m.update(ef_file.read())
    newhash = m.hexdigest()
    if ef.hash != newhash:
        logger.info("New exam file %s with hash %s uploaded." % (ef_path, newhash))
        ef.hash = newhash
        ef.save()


