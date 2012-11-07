Klausumatic 3000
================

A Django-based document management system for the exams collection of my students association. Includes

- Drap and drop upload of PDF files
- File tagging interface that displays the first page of the document
- Cleans up filenames by renaming according to entered metadata

Coming soon:
- Export to Joomla

Maybe coming:
- Export to ILIAS

Screencasts
-----------

- http://fim.uni-mannheim.de/~andreas.fleig/klausumatic.webm
- http://fim.uni-mannheim.de/~andreas.fleig/klausumatic2.webm

Installation
------------

- Add "exams" app to your Django project
- Add the following route to the root urlconf:
  url(r'^klausurdb/', include('exams.urls')),
- If your root urlconf does not start at /, edit the URLs in klausumatic.js
  (search for "Url =")

Dependencies
------------

Frontend:

- jQuery

- jQuery Autocomplete (Pengo Works)
  http://www.pengoworks.com/workshop/jquery/autocomplete.htm
  
- jQuery filedrop
  https://github.com/weixiyen/jquery-filedrop
  
Backend:

- Django (1.4)
- mudraw from mupdf
