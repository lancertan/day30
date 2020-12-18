import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class AppService {    
    httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json' })
}


constructor(private http: HttpClient) {}

    fileUpload(formData: FormData){
        return this.http.post(`/upload`, formData)
          /*  .toPromise()
            .then((result)=>{
                
            }).catch((error)=>{
                console.log(error);
            })*/
    }
}