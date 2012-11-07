#
# KLAUSUMATIC 3000
#
# The MIT License
#
# Copyright (c) 2012 Andreas Fleig
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# coding=utf8

from django.contrib import admin
from models import Exam, ExamFile, Professor, Subject, Degree, Klausumatic
from django.contrib import messages
from views import klausumatic
from django.conf.urls.defaults import patterns, url


def enforce_filenames(modeladmin, request, queryset):
    for o in queryset:
        result = o.enforce_filename()
        if result is not None:
            messages.add_message(request, messages.ERROR, result)
enforce_filenames.short_description = "Enforce filename rules"

class ExamAdmin(admin.ModelAdmin):
    list_display = ['subject', 'professor', 'degree', 'year', 'hws', 'solution', 'download']
    ordering = ['subject', 'professor', 'year', 'hws', 'solution']
    list_filter = ['subject', 'professor', 'year'] 
    actions = [enforce_filenames]
admin.site.register(Exam, ExamAdmin)

# TODO add export to joomla


class ExamFileAdmin(admin.ModelAdmin):
    readonly_fields = ('hash', 'upload_user')
    list_display = ['__unicode__', 'upload_date', 'upload_user', 'exam', 'download']
    ordering = ['path']
    list_filter = ['upload_user']
    search_fields = ['path', 'hash']

    def save_model(self, request, obj, form, change):
        obj.upload_user = request.user.username
        obj.save()
admin.site.register(ExamFile, ExamFileAdmin)


class KlausumaticAdmin(admin.ModelAdmin):
    def get_urls(self):
        my_urls = patterns('',
            url(r'^$', self.admin_site.admin_view(self.klausumatic_redirect), name='exams_klausumatic_changelist')
        )
        return my_urls 

    def klausumatic_redirect(self, request):
        return klausumatic(request)
admin.site.register(Klausumatic, KlausumaticAdmin)


admin.site.register(Professor)
admin.site.register(Degree)
admin.site.register(Subject)

