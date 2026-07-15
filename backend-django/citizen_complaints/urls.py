from django.urls import path
from . import views

urlpatterns = [
    path('predict-triage/', views.triage_complaint, name='predict_triage'),
]