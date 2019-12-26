// Angular
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { AssetModel, AssetsService } from '../../../../../core/assets';
// Layout
import { LayoutConfigService } from '../../../../../core/_base/layout';
// CRUD
import { LayoutUtilsService, MessageType } from '../../../../../core/_base/crud';
import { MatDialog } from '@angular/material';
import { tap, map } from 'rxjs/operators';

// imprts for date hiccup
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports

const moment = _moment;

@Component({
	// tslint:disable-next-line:component-selector
	selector: 'kt-asset-edit',
	templateUrl: './asset-edit.component.html',
	styleUrls: ['./asset-edit.component.scss'],
	providers: [
		{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
	],
})
export class AssetEditComponent implements OnInit {
	loading$: Observable<boolean>;
	loadingSubject = new BehaviorSubject<boolean>(true);
	hasFormErrors: boolean = false;
	headerMargin: number;
	idParams: string;
	form = [];
	addedIcon = false;
	formname = '';
	formTypes;
	sForm;
	formMap: any;
	myForms: any;
	stMap: any;
	assetForm: FormGroup;
	currencies = ['naira', 'dollar'];
	constructor(

		private activatedRoute: ActivatedRoute,
		private router: Router,
		public dialog: MatDialog,
		private layoutUtilsService: LayoutUtilsService,
		private layoutConfigService: LayoutConfigService,
		private fb: FormBuilder,
		private assetsService: AssetsService
	) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();
		this.loadingSubject.next(true);
		this.myForms = [];
		this.formMap = {};
		this.initAssetForm();
		if (this.activatedRoute.snapshot.params['id']) {
			console.log('id found', this.activatedRoute.snapshot.params['id']);
			this.idParams = this.activatedRoute.snapshot.params['id'];
		}
		this.formTypes = [
			{ 'id': 'summary', 'name': 'Summary', 'type': 'text', 'required': 'true' },
			{ 'id': 'date_acquired', 'name': 'Date acquired', 'type': 'date', 'required': 'true' },
			{ 'id': 'cost', 'name': 'Cost of acquisition', 'type': 'number', 'required': 'true' },
			{ 'id': 'depreciation', 'name': 'Depreciation per annum', 'type': 'number', 'required': 'true' },
			{ 'id': 'business_purpose', 'name': 'Business purpose', 'type': 'text', 'required': 'true' },
			{ 'id': 'icon', 'name': 'Icon', 'type': 'file', 'required': 'true' },
			{ 'id': 'business_owners', 'name': 'Business owners', 'type': 'select', 'required': 'true' },
			{ 'id': 'recurrent_expenditure_year', 'name': 'Recurrent expenditure(year)', 'type': 'chart', 'required': 'true' },
			{ 'id': 'recurrent_expenditure_month', 'name': 'Recurrent expenditure(month)', 'type': 'chart', 'required': 'true' },
			{ 'id': 'location_of_deployment', 'name': 'Location of deployment(text)', 'type': 'text', 'required': 'true' },
			// { 'id': 'location_of_deployment_image', 'name': 'Location of deployment(image)', 'type': 'file', 'required': 'true' },
			{ 'id': 'technical_details', 'name': 'Technical details', 'type': 'text', 'required': 'true' },
			{ 'id': 'type', 'name': 'Type (dropdown)', 'type': 'select', 'required': 'true', 'options': ['Software', 'Hardware', 'Connectivity', 'Othere']},
			{ 'id': 'type_others', 'name': 'Type others(text)', 'type': 'text', 'required': 'true' },
			{ 'id': 'historical_cost', 'name': 'Historical cost', 'type': 'chart', 'required': 'true' },
			{ 'id': 'projected_cost', 'name': 'Projected cost', 'type': 'number', 'required': 'true' },
			{ 'id': 'industrial_link', 'name': 'Industrial Link', 'type': 'file', 'required': 'true' },
			{ 'id': 'diagram', 'name': 'Diagram/ Schematics', 'type': 'file', 'required': 'true' },
		];
		if (this.idParams) {
			this.loadingSubject.next(true);
		} else {
			this.loadingSubject.next(false);
		}
		this.stMap = {};
		window.onload = () => {
			const style = getComputedStyle(document.getElementById('kt_header'));
			this.headerMargin = parseInt(style.height, 0);
		};
		this.formTypes.forEach((e) => {
			this.stMap[e.id] = e.name;
		});
	}

	initAssetForm(asset: any = {}) {
		this.assetForm = this.fb.group({
			name: [asset.name || '', Validators.required],
			currency: [asset.name || '', Validators.required]
		});

	}

	handleFormChange(event) {
		console.log(event.target.value);
		if (event.target.value === '') {
			return;
		}
		this.sForm = event.target.value;
		this.formPush();
	}

	formPush() {
		if (this.formMap[this.sForm] === undefined || this.formMap[this.sForm] === false) {
			for (let i = 0; i < this.formTypes.length; i++) {
				if (this.formTypes[i].id === this.sForm) {
					this.myForms.push(this.formTypes[i]);
				}
			}
			this.formMap[this.sForm] = true;
		}
		console.log('myforms', this.myForms);
	}

	formRemove(form) {
		console.log('form', form);
		for (let i = 0; i < this.myForms.length; i++) {
			if (this.myForms[i].id === form.id) {
				console.log(form.id);
				this.myForms.splice(i, 1);
			}
		}
	}

	// roleRemove(role) {
	// 	if (this.roleMap[role]) {
	// 		let filtered = this.myRoles.filter(function(value, index, arr) {

	// 			return value !== role;
	// 		});
	// 		this.myRoles = filtered;
	// 		this.roleMap[role] = false;
	// 	}
	// }


	getComponentTitle() {
		return 'Asset form container';
	}

	onAlertClose($event) {
		this.hasFormErrors = false;
	}

	addIcon() {
		this.addedIcon = !this.addedIcon;
		const funcForm = this.form;
		if (funcForm.length) {
			for (let i = 0; i < funcForm.length; i++) {
				if (funcForm[i].id === 'icon') {
					funcForm.splice(i, 1);
					console.log(this.form);
					return this.form = funcForm;
				} else {
					const obj = {
						id: 'icon',
						type: 'file',
						required: true,
					};
					console.log(this.form);
					return this.form.push(obj);
				}
			}
		} else {
			const obj = {
				id: 'icon',
				type: 'file',
				required: true,
			};
			console.log(this.form);
			return this.form.push(obj);
		}
	}

	addSummary() {
		this.addedIcon = !this.addedIcon;
		const funcForm = this.form;
		if (funcForm.length) {
			for (let i = 0; i < funcForm.length; i++) {
				if (funcForm[i].id === 'summary') {
					funcForm.splice(i, 1);
					console.log(this.form);
					return this.form = funcForm;
				} else {
					const obj = {
						id: 'summary',
						type: 'text',
						required: true,
					};
					console.log(this.form);
					return this.form.push(obj);
				}
			}
		} else {
			const obj = {
				id: 'summary',
				type: 'text',
				required: true,
			};
			console.log(this.form);
			return this.form.push(obj);
		}
	}

	addFormElement(type, index) {
		this.addedIcon = !this.addedIcon;
		const funcForm = this.form;
		if (funcForm.length) {
			for (let i = 0; i < funcForm.length; i++) {
				if (funcForm[i].id === index) {
					funcForm.splice(i, 1);
					console.log(this.form);
					return this.form = funcForm;
				} else {
					const obj = {
						id: index,
						type: type,
						required: true,
					};
					console.log(this.form);
					return this.form.push(obj);
				}
			}
		} else {
			const obj = {
				id: index,
				type: type,
				required: true,
			};
			console.log(this.form);
			return this.form.push(obj);
		}
	}

	onSubmit() {
		this.loadingSubject.next(true);
		const payload = this.assetForm.value;
		if (this.myForms.length > 0) {
			payload.forms = this.myForms;
			this.assetsService.createAsset(payload).subscribe(
				data => {
					this.loadingSubject.next(false);
					console.log('success reponse', data);
					const message = `New asset has been successfully created`;
					this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
					this.router.navigate(['/cdash/assets/assets']);
				}, error => {
					this.loadingSubject.next(false);
					console.log('Error response', error);
					const title = 'Please Retry';
					const message = 'Sorry, Temporary Error Occured';
					this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
				});
		} else {
			const message = `Please add elements to create a form`;
			this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
		}
	}

	reset() {
		this.initAssetForm();
		this.hasFormErrors = false;
		this.assetForm.markAsPristine();
		this.assetForm.markAsUntouched();
		this.assetForm.updateValueAndValidity();
	}
}
