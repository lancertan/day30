import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {CameraService} from '../camera.service';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

	//@ViewChild('imageFile') imageFile: ElementRef;

	imagePath = '/assets/cactus.png'
	
	imgSet = false

	form = new FormGroup({
		//'image-file': new FormControl("", Validators.required),
		title: new FormControl("", Validators.required),
		comments: new FormControl("", Validators.required)
	  })

	constructor(private router: Router, private cameraSvc: CameraService, private fb: FormBuilder, private http: HttpClient, private appSvc: AppService, private authSvc: AuthService) { }

	ngOnInit(): void {
		this.form = this.mkForm()
	  
		if (this.cameraSvc.hasImage()) {
		  const img = this.cameraSvc.getImage()
		  this.imagePath = img.imageAsDataUrl
		  this.imgSet = true
	  }
	}
	
	private mkForm(secret = ''): FormGroup {
		return this.form = this.fb.group({
      title: this.fb.control("", [ Validators.required, Validators.minLength(1) ]),
      comments: this.fb.control("", [ Validators.required, Validators.minLength(1) ])
		})
  	}

	clear() {
		this.imagePath = '/assets/cactus.png'
		this.imgSet = false
		this.form.reset()
	}

	share(){
		const formData = new FormData();
		formData.set('title', this.form.get('title').value)
		formData.set('comments', this.form.get('comments').value)
		formData.set('upload', this.cameraSvc.getImage().imageData)
		formData.set('username', this.authSvc.getUsername() )
		formData.set('password', this.authSvc.getPassword() )		
		
		this.appSvc.fileUpload(formData)
		.subscribe(response=>{
			this.clear()
			console.log('Successfully shared')
		}, e => {
			console.error(e)
			if(e.status.toString() == '401') {
				console.log('Share not successful')
				this.router.navigate(['/'])
			}
		})
	}
}
