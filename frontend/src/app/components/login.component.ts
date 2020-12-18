import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { AuthService } from '../auth.service';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = ''
  
  resp

  form: FormGroup

	constructor(private fb: FormBuilder, private authSvc : AuthService, private http: HttpClient, private router: Router ) { }

	ngOnInit(): void {

    this.form = this.mkForm()

   }

   private mkForm(secret = ''): FormGroup {
		return this.form = this.fb.group({
      username: this.fb.control("", [ Validators.required, Validators.minLength(1) ]),
      password: this.fb.control("", [ Validators.required, Validators.minLength(1) ])
		})
  }
  
  async checkLogin() {
   
    this.authSvc.checkLogin(this.form.value)
    .subscribe(response => {
      if(response.authenticated){
        console.log('login success')
        //set username and password in authsvc
        this.authSvc.setUserName(this.form.value.username)
        this.authSvc.setPassword(this.form.value.password)
        this.router.navigate(['/main'])
      }
    }, err => {
      console.log('login fail')
      this.errorMessage = 'Login fail, please check username or password'
    })
    
    /*
      this.http.post(`http://localhost:3000/login`, this.form.value)
      .toPromise()
      .then((result)=>{
          console.log('successful login')
          console.log(result)
          this.router.navigate(['/main'])
      }).catch((error)=>{
          console.log(error)
          console.log('login fail')
          this.errorMessage = 'Login fail, please check username or password'
          
      })
      */
	}
}

