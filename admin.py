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
    list_display = ['subject', 'professor', 'degree', 'year', 'hws', 'solution']
    ordering = ['subject', 'professor', 'year', 'hws', 'solution']
    list_filter = ['subject', 'professor', 'year'] 
    actions = [enforce_filenames]
admin.site.register(Exam, ExamAdmin)

# TODO add export to joomla


class ExamFileAdmin(admin.ModelAdmin):
    readonly_fields = ('hash', 'upload_user')
    list_display = ['path', 'hash', 'exam']
    ordering = ['path']
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

