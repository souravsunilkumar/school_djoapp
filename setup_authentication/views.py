from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

def home(request):
    return render(request,'index.html')


def admin_login(request):
    return HttpResponse('hello')


@csrf_exempt
def employee_login(request):
    return HttpResponse('hai')
    

def render_demo(request):
    return render(request,'demo.html')