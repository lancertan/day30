import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Form } from "@angular/forms";

@Injectable()
export class AuthService {
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json' })
    }
    private username = ''
    private password = ''

    constructor(private http: HttpClient) {}

    checkLogin(p: FormData) {
        return this.http.post<any>(`/login`, p)
    }

    setUserName(username: string){
        this.username = username
    }

    setPassword(password: string){
        this.password = password
    }

    getUsername(): string{
        return this.username
    }

    getPassword(): string{
        return this.password
    }
}