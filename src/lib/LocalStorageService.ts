'use strict';

import { Memento } from "vscode";

export class LocalStorageService {
    
    constructor(private storage: Memento) { }   
    
    public getValue(key : string) : any{
        return this.storage.get<any>(key, null);
    }

    public setValue<T>(key : string, value : T){
        this.storage.update(key, value );
    }
}