// Angular
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { AssetsService } from '../../../../../core/assets';
import { Location } from '@angular/common';
// Layout
import { LayoutConfigService } from '../../../../../core/_base/layout';
// CRUD
import { LayoutUtilsService, MessageType } from '../../../../../core/_base/crud';
import { MatDialog } from '@angular/material';
import icons from './line-awesome';

// imprts for date hiccup
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports

const moment = _moment;

@Component({
	// tslint:disable-next-line:component-selector
	selector: 'kt-asset-container',
	templateUrl: './asset-container.component.html',
	styleUrls: ['./asset-container.component.scss'],
	providers: [
		{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
	],
})
export class AssetContainerComponent implements OnInit {
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
	fs;
	formMap: any;
	myForms: any;
	stMap: any;
	iconsList = icons;
	selectedType = 'text';
	customName = '';
	customForm;
	assetForm: FormGroup;
	currencies = ['naira', 'dollar'];
	customTypes = ['text', 'number'];
	customIndex = 1;
	formIcon = '';
	containerId = '';
	containerAssets: any;
	compulsoryFields = [
		{ 'id': 'summary', 'name': 'Summary', 'type': 'text', 'required': 'true' },
		{ 'id': 'date_acquired', 'name': 'Date acquired', 'type': 'date', 'required': 'true' },
		{ 'id': 'cost', 'name': 'Cost of acquisition(naira)', 'type': 'number', 'required': 'true' },
		{ 'id': 'business_purpose', 'name': 'Business purpose', 'type': 'text', 'required': 'true' },
		{ 'id': 'type', 'name': 'Type (dropdown)', 'type': 'select', 'required': 'true', 'options': ['Software', 'Hardware', 'Connectivity', 'Business_continuity', 'Others'] },
		{ 'id': 'depreciation', 'name': 'Depreciation per annum(%)', 'type': 'number', 'max': '100', 'required': 'true' },
	];
	constructor(
		private activatedRoute: ActivatedRoute,
		private router: Router,
		public dialog: MatDialog,
		private route: ActivatedRoute,
		private layoutUtilsService: LayoutUtilsService,
		private _location: Location,
		private fb: FormBuilder,
		private assetsService: AssetsService
	) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();
		this.loadingSubject.next(true);
		this.containerId = this.route.snapshot.params['id'];
		this.myForms = [];
		this.assetsService.getAssetContainerById(this.containerId).subscribe(
			assetsData => {
				if (typeof assetsData['data'].form === 'string') {
					assetsData['data'].form = JSON.parse(assetsData['data'].form);
				}
				this.containerAssets = assetsData['data'];
				if (typeof this.containerAssets.form[0] === 'string') {
					this.containerAssets.form = JSON.parse(this.containerAssets.form);
				}
				this.loadingSubject.next(false);
				this.initAssetForm(assetsData['data']);
				if (this.containerAssets.form) {
					this.containerAssets.form.forEach(field => {
						this.compulsoryFields.forEach(cField => {
							if (field.id === cField.id) {
								this.containerAssets.splice(field.id, 1);
							} else {
								if (this.formMap[field.id] === undefined || this.formMap[field.id] === false) {
									this.myForms.push(field);
									this.formMap[field.id] = true;
								}
							}
						});
					});
				}
				localStorage.setItem('formElement', JSON.stringify(assetsData['data']));
				this.loadingSubject.next(false);
			},
			error => {
				console.log('error occured', error);
				this.loadingSubject.next(false);
			}
		);
		this.formMap = {};
		this.customForm = {};
		this.initAssetForm();
		if (this.activatedRoute.snapshot.params['id']) {
			console.log('id found', this.activatedRoute.snapshot.params['id']);
			this.idParams = this.activatedRoute.snapshot.params['id'];
		}
		this.formTypes = [
			{ 'id': 'technical_details', 'name': 'Technical details', 'type': 'text', 'required': 'true' },
			{ 'id': 'industrial_link', 'name': 'Industrial Link', 'type': 'file', 'required': 'true' },
			{ 'id': 'diagram', 'name': 'Diagram/ Schematics', 'type': 'file', 'required': 'true' },
			{ 'id': 'business_owners', 'name': 'Business owners', 'type': 'select', 'required': 'true' },
			{ 'id': 'location_of_deployment', 'name': 'Location of deployment', 'type': 'text', 'required': 'true' },
			{ 'id': 'icon', 'name': 'Icon', 'type': 'file', 'required': 'true' },
			{ 'id': 'recurrent_expenditure_year', 'name': 'Recurrent expenditure(year)', 'type': 'chart', 'required': 'true' },
			{ 'id': 'recurrent_expenditure_month', 'name': 'Recurrent expenditure(month)', 'type': 'chart', 'required': 'true' },
			{ 'id': 'historical_cost', 'name': 'Historical cost', 'type': 'chart', 'required': 'true' },
			{ 'id': 'projected_cost', 'name': 'Projected cost (naira)', 'type': 'number', 'required': 'true' }
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

	goBack() {
		this._location.back();
	}

	chooseIcon(icon) {
		this.formIcon = icon;
		console.log(this.formIcon);
	}

	initAssetForm(asset: any = {}) {
		this.assetForm = this.fb.group({
			name: [asset.name || '', Validators.required],
			customName: [''],
			customType: ['']
		});

	}

	createCustom() {
		if (this.customName === '') {
			return this.layoutUtilsService.showActionNotification('Enter form name', MessageType.Create, 4000, true, true);
		}
		this.customIndex++;
		this.customForm = {
			'id': `custom${this.customIndex}`,
			'name': this.customName,
			'custom': true,
			'type': this.selectedType
		};
		this.myForms.push(this.customForm);
		this.customName = '';
		console.log('custom form', this.myForms);
	}

	passValue(event) {
		this.selectedType = event.target.value;
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

	getComponentTitle() {
		return 'Asset form container';
	}

	onAlertClose(event) {
		console.log(event.target.value);
		this.hasFormErrors = false;
	}

	onSubmit() {
		this.loadingSubject.next(true);
		let payload = new FormData();
		let forms = this.assetForm.value;
		for (let key in forms) {
			payload.append(key, forms[key]);
		}
		this.compulsoryFields.forEach(field => {
			this.myForms.push(field);
		});
		payload.append('forms', JSON.stringify(this.myForms));
		if (this.fs) {
			payload.append('icon', this.fs, this.fs.name);
		}
		if (this.formIcon) {
			payload.append('icon_name', this.formIcon);
		}
		this.assetsService.editAssetContainer(payload, this.containerId).subscribe(
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
		// } else {
		// 	const message = `Please add elements to create a form`;
		// 	this.layoutUtilsService.showActionNotification(message, MessageType.Create, 10000, true, true);
		// }
	}

	onFileChange(event) {
		if (event.target.files.length > 0) {
			this.fs = event.target.files[0];
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
