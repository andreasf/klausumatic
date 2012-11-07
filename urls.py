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
