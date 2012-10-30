from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('exams.views',
    url(r'^list_untagged$', 'list_untagged'),
    url(r'^image/(\d+)', 'image'),
    url(r'^file/(\d+)', 'file_switch'),
    url(r'^metadata/(\d+)', 'metadata_switch'),
    url(r'^professors', 'get_professors'),
    url(r'^subjects', 'get_subjects'),
    url(r'^degrees', 'get_degrees'),
    url(r'^file/new$', 'post_file'),
)
