from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
# Create your views here.

def home(request):
    return render(request,'index.html')


def signup(request):
    return 