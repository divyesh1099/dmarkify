from django.urls import path
from . import views

urlpatterns = [
    path('list_fonts/', views.list_fonts, name='list_fonts'),
    path('upload_font/', views.upload_font, name='upload_font'),
    path('upload/', views.upload_files, name='upload_files'),
]
