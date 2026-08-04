from django.urls import path
from . import views

urlpatterns = [
    path('predict-triage/', views.predict_triage, name='predict_triage'),
    path('triage/', views.triage_complaint, name='triage_complaint'),
    path('health/', views.complaints_health, name='complaints_health'),
]