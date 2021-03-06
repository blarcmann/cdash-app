// Angular
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// RxJS
import { Observable, Subject } from 'rxjs';
// Translate
import { TranslateService } from '@ngx-translate/core';
// Store
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/reducers';
// Auth
import { AuthNoticeService, AuthService, Login } from '../../../../core/auth';
import { RolesService } from '../../../../core/roles';

/**
 * ! Just example => Should be removed in development
 */
const DEMO_PARAMS = {
	EMAIL: '',
	PASSWORD: ''
};

@Component({
	selector: 'kt-login',
	templateUrl: './login.component.html',
	encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, OnDestroy {
	// Public params
	loginForm: FormGroup;
	loading = false;
	isLoggedIn$: Observable<boolean>;
	errors: any = [];
	userData: any;
	roles;
	private unsubscribe: Subject<any>;

	private returnUrl: any;

	// Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

	/**
	 * Component constructor
	 *
	 * @param router: Router
	 * @param auth: AuthService
	 * @param authNoticeService: AuthNoticeService
	 * @param translate: TranslateService
	 * @param store: Store<AppState>
	 * @param fb: FormBuilder
	 * @param cdr
	 * @param route
	 */
	constructor(
		private router: Router,
		private auth: AuthService,
		private rolesService: RolesService,
		private authNoticeService: AuthNoticeService,
		private translate: TranslateService,
		private store: Store<AppState>,
		private fb: FormBuilder,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {
		this.unsubscribe = new Subject();
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.initLoginForm();
		this.auth.checkOrganization().subscribe(response => {
			if (response.status === true && response.data !== null && response.data.superAdmin === true) {
				return;
			} else {
				this.router.navigate(['/auth/create-organization']);
			}
		});
		// redirect back to the returnUrl before login
		this.route.queryParams.subscribe(params => {
			this.returnUrl = params['returnUrl'] || '/';
		});
	}

	/**
	 * On destroy
	 */
	ngOnDestroy(): void {
		this.authNoticeService.setNotice(null);
		this.unsubscribe.next();
		this.unsubscribe.complete();
		this.loading = false;
	}

	/**
	 * Form initalization
	 * Default params, validators
	 */
	initLoginForm() {
		this.loginForm = this.fb.group({
			email: ['', Validators.compose([
				Validators.required,
				Validators.email,
				Validators.minLength(3),
				Validators.maxLength(320) // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
			])
			],
			password: ['', Validators.compose([
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(100)
			])
			]
		});
	}

	/**
	 * Form Submit
	 */
	submit() {
		const controls = this.loginForm.controls;
		/** check form */
		if (this.loginForm.invalid) {
			Object.keys(controls).forEach(controlName =>
				controls[controlName].markAsTouched()
			);
			return;
		}

		this.loading = true;

		const authData = {
			email: controls['email'].value,
			password: controls['password'].value
		};
		this.auth
			.login(authData.email, authData.password)
			.subscribe(response => {
				console.log(response);
				const responseData = response['data'];
				if (response['status'] === false) {
					this.loading = false;
					return this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
				}
				if (responseData.user_token) {
					this.store.dispatch(new Login({ authToken: responseData.user_token }));
					localStorage.setItem('userToken', responseData.user_token);
					localStorage.setItem('loginId', responseData.user_id);
					localStorage.setItem('userId', responseData.user_id);
					localStorage.setItem('userDetails', JSON.stringify(responseData));
					localStorage.setItem('orgDetails', JSON.stringify(responseData.organization));
					this.userData = responseData.organization;
					localStorage.setItem('loginData', JSON.stringify(this.userData));
					this.getAllRoles();
					this.router.navigateByUrl(this.returnUrl); // Main page
				} else {
					this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
					this.loading = false;
				}
			});
	}

	getAllRoles() {
		localStorage.setItem('roles', '');
		this.rolesService.getRoles(0, 999).subscribe(
			responseData => {
				let userDetails;
				if (localStorage.getItem('userDetails')) {
					userDetails = JSON.parse(localStorage.getItem('userDetails'));
				}
				this.roles = responseData['data'];
				this.roles.forEach(role => {
					if (userDetails.role === role._id) {
						console.log(role, userDetails.role);
						localStorage.setItem('roles', role.permissions);
					}
				});
			},
			error => {
				console.log('error', error);
			}
		);
	}
	// togettingtoken


	/**
	 * Checking control validation
	 *
	 * @param controlName: string => Equals to formControlName
	 * @param validationType: string => Equals to valitors name
	 */
	isControlHasError(controlName: string, validationType: string): boolean {
		const control = this.loginForm.controls[controlName];
		if (!control) {
			return false;
		}

		const result = control.hasError(validationType) && (control.dirty || control.touched);
		return result;
	}
}
