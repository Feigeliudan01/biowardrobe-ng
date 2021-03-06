import { Meteor } from 'meteor/meteor';
import { Session} from 'meteor/session';
import { check } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';

import { Injectable, NgZone } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import {Observable, BehaviorSubject, bindCallback, combineLatest} from 'rxjs';
import {map, filter, tap, mergeMap} from 'rxjs/operators';

import { BWServiceBase } from './service.base';
import { Tracker } from 'meteor/tracker';

const loginRoute = ['/login'];


const unique = (value: any, index: any, self: any) => {
    return self.indexOf(value) === index;
}


@Injectable()
export class BWAccountService extends BWServiceBase {

    currentUser: any;
    _currentUserId: string;
    isLoggedIn: boolean;
    isLoggingIn: boolean;

    private _rolesAvail$: BehaviorSubject<any> = new BehaviorSubject<any>(false);

    private _account$: BehaviorSubject<BWAccountService> = new BehaviorSubject<BWAccountService>(null);

    public get account$(): Observable<BWAccountService> {
        return this._account$.pipe(
                tap ( (a: any) => {console.log("Got account. Is logged in", a.isLoggedIn)} ),
                mergeMap( (a) =>
                    this._rolesAvail$.pipe(
                        filter(_ => _),
                        tap((r) => console.log("Are roles available", r)),
                        map(() => a))
                ),
                filter(_ => !!_)
            );
    }
    

    public hasPermission (checkPermissions: any, scope = Roles.GLOBAL_GROUP) {
        check(checkPermissions, [String]);
        let permissions = checkPermissions.filter(unique);
        console.log("Check", permissions, "permissions for", this._currentUserId);
        return Roles.userIsInRole(this._currentUserId, permissions, scope);
    }

    constructor(private _zone: NgZone, private _router: Router) {
        super();

        Tracker.autorun(() => {
            //@ts-ignore
            if (Roles.subscription.ready()){
                this._rolesAvail$.next(true);
            }
        });

        Tracker.autorun((c) => {
            this.currentUser = Meteor.user();
            this._currentUserId = Meteor.userId();
            this.isLoggedIn = !!this.currentUser;
            this.isLoggingIn = Meteor.loggingIn();
            this._account$.next(this);
        });
    }

    forgotPassword(email:string):Observable<any> {
        let accountFn = bindCallback(Accounts.forgotPassword);
        return accountFn({email: email});
    }

    resetPassword(token:string, newPassword:string):Observable<any> {
        let accountFn = bindCallback(Accounts.resetPassword);
        return accountFn(token, newPassword);
    }

    login(email:string, password:string):Observable<any> {
        let loginObservable = bindCallback(function (callback) {
            Accounts['callLoginMethod']({
                methodArguments: [{email: email, pass: password, biowardrobeng: true}],
                userCallback: callback
            });
        });
        return loginObservable();
    }

}

/**
 *
 * Logged in guard protects access to authorization required routes
 *
 */
@Injectable()
export class LoggedInGuard implements CanActivate {

    constructor(private _authService: BWAccountService, private _router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return this._authService.account$.pipe(
            map((account: BWAccountService) => {
                if (!account.isLoggedIn){
                    console.log("guard: user isn't logged in", state.url);
                    Session.set('lastNavigationAttempt', state.url);
                    this._router.navigate(loginRoute);
                    return false;
                }
                return true;
            })
        )
    }

}

@Injectable()
export class LoggedInAdminGuard implements CanActivate {

    constructor(private _authService: BWAccountService, private _router:Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return this._authService.account$.pipe(
            map((account: BWAccountService) => {
                if (!account.isLoggedIn || !account.hasPermission(['admin'])){
                    console.log("guard: user is not logged in or roles are not accessible or he is not the admin", state.url);
                    Session.set('lastNavigationAttempt', state.url);
                    this._router.navigate(loginRoute);
                    return false;
                }
                return true;
            })
        )
    }

}
