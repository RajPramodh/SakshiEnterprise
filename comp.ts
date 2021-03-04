import { HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiCallService } from 'src/app/core/services/api-call.service';
import { DataSharingService } from 'src/app/core/services/data-sharing.service';
import { DataService } from 'src/app/core/services/data.service';
import { AlphaPage, ApplicationContactTable, ContactField } from 'src/app/core/services/model.service';
import { SortService } from 'src/app/core/services/sort.service';
import { UtilityService } from 'src/app/core/services/utility.service';
import { environment } from 'src/environments/environment';
import { v4 as uuid } from 'uuid';
import { trigger, transition, animate, style } from '@angular/animations';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import { ExportService } from 'src/app/core/services/export.service';
import * as moment from 'moment';

@Component({
  selector: 'pulse-contact-table',
  templateUrl: './contact-table.component.html',
  styleUrls: ['./contact-table.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-15%)', opacity: 0 }),
        animate('0.5s ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.5s ease-in', style({ transform: 'translateX(-15%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ContactTableComponent implements OnInit {


  applicationContactTablelist: ApplicationContactTable[] = [];
  displayApplicationContactTablelist: ApplicationContactTable[] = [];
  resultApplicationContactTablelist: ApplicationContactTable[] = [];
  alphaApplicationContactTablelist: ApplicationContactTable[] = [];
  renderTableTemplate = false;
  totalUnits: number;

  searchForm: FormGroup;
  searchFieldsList = ["applicationName", "programName", "platformName", "programOwner", "bizOpsOwner"];

  temp = false;
  showEditBtn = false;
  selectedRows: ApplicationContactTable[] = [];

  contactFieldList: ContactField[] = [];
  alphaPageList: AlphaPage[] = [];
  selectedAlphabet = '';

  showEditApplnInfo = false;
  showNewFieldForm = false;
  superAdmin = false;
  isLoading = false;

  constructor(private readonly apiCallService: ApiCallService, private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly utilityService: UtilityService,
    public readonly dataSharingService: DataSharingService, private readonly formBuilder: FormBuilder,
    private readonly confirmationPopupService: ConfirmationPopupService) {
    this.superAdmin = this.dataSharingService.superAdmin;
    this.searchForm = this.formBuilder.group({
      applicationName: [''],
      programName: [''],
      platformName: [''],
      programOwner: [''],
      bizOpsOwner: ['']
    });
    this.getAppplicationContactTableData();
  }

  ngOnInit(): void {

  }

  getContactFieldList() {
    const correlationID = uuid.v4();
    const httpOptions = {
      headers: new HttpHeaders({
        'X-MC-Correlation-ID': correlationID,
        'X-Field-Id': "",
        'X-Fill-Employees': 'false',
        'X-Data-Migration': 'false'
      }),
    };
    this.apiCallService.getData(environment.pulseUrl + environment.fieldUrl, httpOptions).subscribe(
      (data: any) => {
        this.contactFieldList = data.responseData;
        this.contactFieldList = SortService.ascendingSort(this.contactFieldList, 'fieldValue');
      },
      (error) => {
        console.log("failed");
      });
  }

  getAppplicationContactTableData() {
    this.alphaPageList = [...DataService.getAlphaPagerList()];
    this.isLoading = true;
    const correlationID = uuid.v4();
    const httpOptions = {
      headers: new HttpHeaders({
        'X-MC-Correlation-ID': correlationID,
      }),
    };
    this.apiCallService.getData(environment.pulseUrl + environment.contactTableUrl, httpOptions).subscribe(
      (data: any) => {
        if (data) {
          this.applicationContactTablelist = [];
          this.resultApplicationContactTablelist = [];
          let j = 0;
          for (var [i] of data.responseData.entries()) {
            if (data.responseData[i].appName !== null) {
              this.applicationContactTablelist[j] = this.getApplicationContactTableObject();

              this.applicationContactTablelist[j].id = data.responseData[i].appId;
              this.applicationContactTablelist[j].applicationName = data.responseData[i].appName.trim();
              this.applicationContactTablelist[j].programName = data.responseData[i].programName;
              this.applicationContactTablelist[j].platformName = data.responseData[i].platformName;
              this.applicationContactTablelist[j].bizOpsOwner = data.responseData[i].bizOpsOwner;
              this.applicationContactTablelist[j].programOwner = data.responseData[i].programOwner;
              this.applicationContactTablelist[j].isSelected = false;
              this.applicationContactTablelist[j].enableEditForm = false;
              this.applicationContactTablelist[j].showApplnInfo = false;
              this.applicationContactTablelist[j].appUuid = data.responseData[i].appUuid;
              this.applicationContactTablelist[j].serviceUuid = data.responseData[i].serviceUuid;
              this.applicationContactTablelist[j].serviceName = data.responseData[i].platformName;
              this.applicationContactTablelist[j].programId = data.responseData[i].programId;
              this.applicationContactTablelist[j].platformId = data.responseData[i].serviceId;
              j++;
            }
          }
          this.resultApplicationContactTablelist = [...SortService.ascendingSort(this.applicationContactTablelist, "applicationName")];
          this.applicationContactTablelist = [...SortService.ascendingSort(this.applicationContactTablelist, "applicationName")];
          this.alphaApplicationContactTablelist = [...this.resultApplicationContactTablelist];
          this.totalUnits = this.applicationContactTablelist.length === 0 ? 10 : this.applicationContactTablelist.length;
          this.displayApplicationContactTablelist = this.applicationContactTablelist.slice(0, 10);
          this.renderTableTemplate = true;
          this.searchForm.reset();
          this.changeDetectorRef.detectChanges();
        }
        this.isLoading = false;
        this.getContactFieldList();
      },
      (error) => {
        console.log("Failed");
        this.isLoading = false;
      }
    );
  }

  onAddNewField() {
    this.showNewFieldForm = true;
  }

  closeFieldForm(event: boolean) {
    this.showNewFieldForm = false;
    if (event) {
      this.getContactFieldList();
    }
  }

  getApplicationContactTableObject() {
    return new ApplicationContactTable();
  }

  onChangePage(event: any) {
    this.displayApplicationContactTablelist = this.applicationContactTablelist.slice(event.detail.firstUnitIndex, event.detail.lastUnitIndex);
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  onFilterChange() {
    const data = this.utilityService.filterTableData(this.alphaApplicationContactTablelist, this.searchForm, this.searchFieldsList);
    this.applicationContactTablelist = [...SortService.ascendingSort(data, "applicationName")];
    this.totalUnits = this.applicationContactTablelist.length === 0 ? 10 : this.applicationContactTablelist.length;
    this.displayApplicationContactTablelist = this.applicationContactTablelist.slice(0, 10);
  }

  onSelectAll(eventStatus: any) {
    if (eventStatus) {
      this.temp = true;
      this.changeDetectorRef.detectChanges();
      this.selectedRows = [];
      for (var [i] of this.applicationContactTablelist.entries()) {
        this.applicationContactTablelist[i].isSelected = true;
      }
      this.selectedRows.push(...this.applicationContactTablelist);
    }
    else {
      this.temp = false;
      this.changeDetectorRef.detectChanges();
      for (var [j] of this.applicationContactTablelist.entries()) {
        this.applicationContactTablelist[j].isSelected = false;
      }
      this.selectedRows = [];
    }
    this.getShowBtnStatus();
  }

  onSelectRow(selectedRow: any) {
    this.selectedRows.push(selectedRow);
    this.getShowBtnStatus();
  }

  onUnSelectRow(selectedRow: any) {
    this.selectedRows = this.selectedRows.filter(item => item.applicationName !== selectedRow.applicationName);
    this.getShowBtnStatus();
  }

  getShowBtnStatus() {
    if (this.selectedRows.length >= 1) {
      this.showEditBtn = true;
    }
    else {
      this.showEditBtn = false;
    }
  }

  filterPageByAlpha(event: any, pageObj: any) {
    this.searchForm.reset();
    this.selectedAlphabet = event.target.value;
    var data = this.utilityService.filterByLetter(this.resultApplicationContactTablelist, this.selectedAlphabet, 'applicationName');
    this.applicationContactTablelist = [];
    this.applicationContactTablelist = data;
    this.alphaApplicationContactTablelist = [...this.applicationContactTablelist];
    this.totalUnits = this.applicationContactTablelist.length === 0 ? 10 : this.applicationContactTablelist.length;
    this.displayApplicationContactTablelist = this.applicationContactTablelist.slice(0, 10);
    pageObj.selected = true;
    this.alphaPageList.forEach((item) => {
      if ((item.selected === true && item.value !== pageObj.value)) {
        item.selected = false;
      }
    })
  }

  onBulkEdit() {
    this.showEditApplnInfo = true;
    this.applicationContactTablelist.forEach((item) => {
      item.showApplnInfo = false;
    });
  }

  closeEditApplnInfo(event: boolean) {
    this.showEditApplnInfo = event;
    this.temp = false;
    this.changeDetectorRef.detectChanges();
    for (var [j] of this.applicationContactTablelist.entries()) {
      this.applicationContactTablelist[j].isSelected = false;
    }
    this.selectedRows = [];
    this.getShowBtnStatus();
  }

  downloadExcel() {
    if (this.applicationContactTablelist.length < this.resultApplicationContactTablelist.length) {
      this.confirmationPopupService.confirm('Only the filtered application details in table will be included in excel dump.', '', 'Proceed', 'Cancel', 'lg')
        .then((confirmed) => this.callDownloadExcel(confirmed))
        .catch(() => console.log("Exception")
        );
    }
    else {
      this.callDownloadExcel(true);
    }
  }

  getAppIdList() {
    let appIdList = '';
    if ((this.searchForm.value.programName === '' || this.searchForm.value.programName === null
      || this.searchForm.value.programName === undefined) &&
      (this.searchForm.value.platformName === '' || this.searchForm.value.platformName === null
        || this.searchForm.value.platformName === undefined)) {
      for (var [k] of this.applicationContactTablelist.entries()) {
        appIdList = appIdList + this.applicationContactTablelist[k].id;
        if (k !== this.applicationContactTablelist.length - 1) {
          appIdList = `${appIdList},`;
        }
      }
    }
    return appIdList;
  }

  getPlatformIdList() {
    let platformIdList = '';
    if (this.searchForm.value.platformName !== '' && this.searchForm.value.platformName !== null
      && this.searchForm.value.platformName !== undefined) {
      let platformList = [];
      for (var [j] of this.applicationContactTablelist.entries()) {
        platformList.push(this.applicationContactTablelist[j].platformId);
      }
      platformList = [...new Set(platformList)];
      platformList.forEach((item, index) => {
        platformIdList = platformIdList + item;
        if (index !== platformIdList.length - 1) {
          platformIdList = `${platformIdList},`;
        }
      });
    }
    return platformIdList;
  }

  getProgramIdList() {
    let programIdList = '';
    if (this.searchForm.value.programName !== '' && this.searchForm.value.programName !== null
      && this.searchForm.value.programName !== undefined) {
      let programList = [];
      for (var [i] of this.applicationContactTablelist.entries()) {
        programList.push(this.applicationContactTablelist[i].programId);
      }
      programList = [...new Set(programList)];
      console.log(programList);
      programList.forEach((item, index) => {
        programIdList = programIdList + item;
        if (index !== programIdList.length - 1) {
          programIdList = `${programIdList},`;
        }
      });
    }
    return programIdList;
  }

  getUrl(appIdList: string, platformIdList: string, programIdList: string) {
    let url = '';
    if (appIdList !== '') {
      appIdList = `applicationId=${appIdList}`;
      url = `?${appIdList}`;
    }
    if (platformIdList !== '') {
      platformIdList = `serviceId=${platformIdList}`;
      if (url !== '') {
        url = `${url}&${platformIdList}`;
      }
      else {
        url = `?${platformIdList}`;
      }
    }
    if (programIdList !== '') {
      programIdList = `programId=${programIdList}`;
      if (url !== '') {
        url = `${url}&${programIdList}`;
      }
      else {
        url = `?${programIdList}`;
      }
    }
    return url;
  }

  callDownloadExcel(confirmed) {
    if (confirmed) {
      let appIdList = '';
      let platformIdList = '';
      let programIdList = '';
      let url = '';
      if (this.applicationContactTablelist.length < this.resultApplicationContactTablelist.length) {
        programIdList = this.getProgramIdList();
        platformIdList = this.getPlatformIdList();
        appIdList = this.getAppIdList();
      }
      url = this.getUrl(appIdList, platformIdList, programIdList)

      const correlationID = uuid.v4();
      const httpOptions = {
        headers: new HttpHeaders({
          'X-MC-Correlation-ID': correlationID,
        }),
      };
      this.apiCallService.getData(environment.pulseUrl + environment.contactUrl + url, httpOptions).subscribe(
        (data: any) => {
          const excelData = [];
          for (var [j] of this.applicationContactTablelist.entries()) {
            const detailsObj = this.getExcelRowDetail(data.responseData[this.applicationContactTablelist[j].id], this.applicationContactTablelist[j]);
            excelData.push(detailsObj);
          }
          ExportService.exportExcel(excelData, 'ESF-Contact');
        },
        (error) => {
          console.log("failed");
        });
    }
  }

  getExcelRowDetail(dataList: any, indexItem: any) {
    const details = new Object();
    let lastUpdatedUserId;
    var upadtedDate;
    if (dataList !== undefined && dataList !== null) {
      const item = dataList.reduce((prev, current) => (+prev.lastUpdatedDate > +current.lastUpdatedDate) ? prev : current)
      lastUpdatedUserId = item.lastUpdatedUserId;
      upadtedDate = moment(item.lastUpdatedDate).format('MMMM Do YYYY, H:mm:ss');
    }
    else {
      lastUpdatedUserId = 'NA';
      upadtedDate = 'NA';
    }

    details["Application Uuid"] = indexItem.appUuid;
    details["Application Name"] = indexItem.applicationName;
    details["Service Name"] = indexItem.platformName;
    details["Service Uuid"] = indexItem.serviceUuid;
    details["Program Name"] = indexItem.programName;
    details["BizOps Guild Lead"] = indexItem.bizOpsOwner;
    details["Program Owner"] = indexItem.programOwner;
    details["Last Updated User Name"] = lastUpdatedUserId;
    details["Last Updated Time"] = upadtedDate;

    for (var [j] of this.contactFieldList.entries()) {
      if (this.contactFieldList[j].fieldType !== "RG") {
        if ((dataList !== undefined && dataList !== null) &&
          (dataList.find(item => item.fieldId === this.contactFieldList[j].fieldId) !== undefined)) {
          details[`${this.contactFieldList[j].fieldName} Id`] = dataList.find(item1 =>
            item1.fieldId === this.contactFieldList[j].fieldId).empId;
          details[`${this.contactFieldList[j].fieldName} Name`] = dataList.find(item2 =>
            item2.fieldId === this.contactFieldList[j].fieldId).empName;
          details[`${this.contactFieldList[j].fieldName} Email`] = dataList.find(item3 =>
            item3.fieldId === this.contactFieldList[j].fieldId).empEmail;
          details[`${this.contactFieldList[j].fieldName} Role`] = dataList.find(item4 =>
            item4.fieldId === this.contactFieldList[j].fieldId).empRole;
          details[`${this.contactFieldList[j].fieldName} Work Number`] = dataList.find(item5 =>
            item5.fieldId === this.contactFieldList[j].fieldId).empPhone;
          details[`${this.contactFieldList[j].fieldName} Home Number`] = dataList.find(item6 =>
            item6.fieldId === this.contactFieldList[j].fieldId).empMobile;
        }
        else {
          details[`${this.contactFieldList[j].fieldName} Id`] = '';
          details[`${this.contactFieldList[j].fieldName} Name`] = '';
          details[`${this.contactFieldList[j].fieldName} Email`] = '';
          details[`${this.contactFieldList[j].fieldName} Role`] = '';
          details[`${this.contactFieldList[j].fieldName} Work Number`] = '';
          details[`${this.contactFieldList[j].fieldName} Home Number`] = '';
        }
      }
      else {
        if ((dataList !== undefined && dataList !== null)
          && (dataList.find(item7 => item7.fieldId === this.contactFieldList[j].fieldId) !== undefined)) {
          details[this.contactFieldList[j].fieldName] = dataList.find(item8 =>
            item8.fieldId === this.contactFieldList[j].fieldId).empId;
        }
        else {
          details[this.contactFieldList[j].fieldName] = '';
        }
      }
    }
    return details;
  }
}
