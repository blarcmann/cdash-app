// Angular
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { SocialsService } from '../../../../../core/socials';
// Layout
import { LayoutConfigService } from '../../../../../core/_base/layout';
// CRUD
import { LayoutUtilsService, MessageType } from '../../../../../core/_base/crud';
import { MatDialog } from '@angular/material';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { Location } from '@angular/common';

// url

@Component({
	// tslint:disable-next-line:component-selector
	selector: 'kt-social-edit',
	templateUrl: './social-edit.component.html',
	styleUrls: ['./social-edit.component.scss']
})
export class SocialEditComponent implements OnInit, OnDestroy {
	social;
	image: any;
	loading$: Observable<boolean>;
	loadingSubject = new BehaviorSubject<boolean>(true);
	socialForm: FormGroup;
	hasFormErrors: boolean = false;
	headerMargin: number;
	selectedTab: number = 0;
	idParams: string;
	ssocial = 'facebook';
	BASE_URL = environment.BASE_URL;
	appID = '';
	customerKey = '';
	customerSecret = '';
	callbackUrl = '';
	appURL = '';
	clientId = '';
	clientSecret = '';
	callbackUrlLinkedin = '';
	gramName = '';
	setupSocials;
	constructor(
		private activatedRoute: ActivatedRoute,
		private router: Router,
		public dialog: MatDialog,
		private _location: Location,
		private layoutUtilsService: LayoutUtilsService,
		private layoutConfigService: LayoutConfigService,
		private fb: FormBuilder,
		private socialsService: SocialsService
	) { }

	ngOnInit() {
		this.getSocialSetup();
		this.loading$ = this.loadingSubject.asObservable();
		this.loadingSubject.next(true);
		this.appURL = window.location.href;
		if (this.activatedRoute.snapshot.params['id']) {
			console.log('id found', this.activatedRoute.snapshot.params['id']);
			this.idParams = this.activatedRoute.snapshot.params['id'];
			if (this.idParams === 'instagram') {
				console.log('its insta');
				this.ssocial = 'instagram';
			}
		}
		window.onload = () => {
			const style = getComputedStyle(document.getElementById('kt_header'));
			this.headerMargin = parseInt(style.height, 0);
		};
		this.loadingSubject.next(false);
	}

	goBack() {
		this._location.back();
	}

	getSocialDetails() {
		return this.socialsService.getLinkById(this.idParams).pipe(
			map(socialDetails => {
				this.social = socialDetails;
				this.loadingSubject.next(false);
				console.log('retrieving social with pipe', this.social);
				return this.social;
			})
		);
	}

	getSocialSetup() {
		this.loadingSubject.next(true);
		this.socialsService.getSocialSetup().subscribe(
			socialss => {
				this.loadingSubject.next(false);
				this.setupSocials = socialss['data'];
				this.setupSocials.forEach(social => {
					if (social.type === 'facebook') {
						localStorage.setItem('fbkID', social.data.app_id);
						this.appID = social.data.app_id;
					}
					if (social.type === 'twitter') {
						this.customerKey = social.data.consumerKey;
						this.customerSecret = social.data.consumerSecret;
						this.callbackUrl = social.data.callbackUrl;
					}
					if (social.type === 'linkedin') {
						this.clientId = social.data.clientId;
						this.clientSecret = social.data.clientSec;
						this.callbackUrlLinkedin = social.data.callbackUrl;
					}
				});
			}
		);
	}

	passSocial(event) {
		this.ssocial = event.target.value;
	}

	getComponentTitle() {
		let result = 'Please Wait';
		result = `Configure social network`;
		return result;
	}

	onSubmit() {
		this.hasFormErrors = false;
		this.loadingSubject.next(true);
		/** check form */
		if (this.social) {
			this.updateSocial();
			return;
		}
		this.addSocial();
	}


	addSocial() {
		this.loadingSubject.next(true);
		let payload;
		if (this.ssocial === 'facebook') {
			if (this.appID === '') {
				const message = 'appID is compulsory';
				return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			}
			localStorage.setItem('fbkID', this.appID);
			payload = {
				type: 'facebook',
				data: {
					app_id: this.appID
				}
			};
		}
		if (this.ssocial === 'twitter') {
			if (this.customerKey === '' || this.customerSecret === '' || this.callbackUrl === '') {
				const message = 'All fields are compulsory';
				return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			}
			payload = {
				type: 'twitter',
				data: {
					consumerKey: this.customerKey,
					consumerSecret: this.customerSecret,
					callbackUrl: this.callbackUrl
				}
			};
		}
		if (this.ssocial === 'linkedin') {
			if (this.clientId === '' || this.clientSecret === '' || this.callbackUrlLinkedin === '') {
				const message = 'All fields are compulsory';
				return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			}
			payload = {
				type: 'linkedin',
				data: {
					clientId: this.clientId,
					clientSec: this.clientSecret,
					callbackUrl: this.callbackUrlLinkedin
				}
			};
		}
		if (this.ssocial === 'instagram') {
			if (this.gramName === '') {
				const message = 'Instagram handle is compulsory';
				return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 5000, true, true);
			}
			payload = {
				username: this.gramName,
			};
		}
		this.socialsService.addSocial(payload).subscribe(
			data => {
				this.loadingSubject.next(false);
				console.log('success reponse', data);
				const message = `Successfull`;
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
				this.router.navigate(['/cdash/socials/socials']);
			}, error => {
				this.loadingSubject.next(false);
				console.log('Error response', error);
				const title = 'Please Retry';
				const message = 'Sorry, Temporary Error Occured';
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			});
	}

	addInsta() {
		if (this.gramName === '') {
			const message = 'Instagram handle is compulsory';
			return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 5000, true, true);
		}
		let payload = {
			username: this.gramName,
		};

		this.socialsService.addInstagram(payload).subscribe(
			data => {
				this.loadingSubject.next(false);
				console.log('success reponse', data);
				const message = `Successfull`;
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
				this.router.navigate(['/cdash/socials/socials']);
			}, error => {
				this.loadingSubject.next(false);
				console.log('Error response', error);
				const title = 'Please Retry';
				const message = 'Sorry, Temporary Error Occured';
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			});
	}

	updateSocial() {
		let payload;
		if (this.ssocial === 'linkedin') {
			if (this.clientId === '' || this.clientSecret === '' || this.callbackUrlLinkedin === '') {
				const message = 'All fields are compulsory';
				return this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			}
			payload = {
				type: 'linkedin',
				data: {
					clientId: this.clientId,
					clientSec: this.clientSecret,
					callbackUrl: this.callbackUrlLinkedin
				}
			};
		}

		if (this.ssocial === 'facebook') {
			payload = {
				type: 'facebook',
				data: {
					app_id: this.appID
				}
			};
		}

		if (this.ssocial === 'twitter') {
			payload = {
				type: 'twitter',
				data: {
					consumerKey: this.customerKey,
					consumerSecret: this.customerSecret,
					callbackUrl: this.BASE_URL
				}
			};
		}
		this.socialsService.updateLink(payload, this.social.code).subscribe(
			data => {
				console.log('success reponse', data);
				this.loadingSubject.next(false);
				const message = `Updated Successfully`;
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
				this.router.navigate(['/strada/socials/socials']);
			},
			error => {
				this.loadingSubject.next(false);
				console.log('Error response', error);
				const title = 'Please Retry';
				const message = 'Sorry, Temporary Error Occured';
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
			});
	}


	reset() {
		this.appID = '';
		this.customerKey = '';
		this.customerSecret = '';
	}

	/**
	 * Close alert
	 *
	 * @param $event
	 */
	onAlertClose($event) {
		this.hasFormErrors = false;
	}

	ngOnDestroy() { }

}
