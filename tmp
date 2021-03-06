import { HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationContactTable, ContactField } from 'src/app/core/services/model.service';
import { environment } from 'src/environments/environment';
import { v4 as uuid } from 'uuid';
import { ApiCallService } from 'src/app/core/services/api-call.service';
import { DataSharingService } from 'src/app/core/services/data-sharing.service';
import { NotificationService } from 'src/app/shared/notification/notification.service';
import { NotificationConstants } from 'src/app/shared/notification/notification.constants';

@Component({
  selector: 'pulse-edit-info',
  templateUrl: './edit-info.component.html',
  styleUrls: ['./edit-info.component.css']
})
export class EditInfoComponent implements OnInit {

  @Input() selectedRows: ApplicationContactTable[] = [];
  @Input() contactFieldList: ContactField[] = [];

  @Output() closeBulkEditForm = new EventEmitter<boolean>();

  selectedRowsData: ApplicationContactTable[] = [];
  contactFieldListData: ContactField[] = [];

  editForm: FormGroup;
  arrayControl: FormArray;
  showErrorMsg = false;

  constructor(private readonly formBuilder: FormBuilder, private readonly apiCallService: ApiCallService,
    private readonly dataSharingService: DataSharingService, private readonly notificationService: NotificationService) {
    var newForm = this.formBuilder.group({
      formArray: this.formBuilder.array([])
    });
    this.editForm = newForm;
    this.arrayControl = this.editForm.controls['formArray'] as FormArray;
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
    this.selectedRowsData = this.selectedRows;
    this.contactFieldListData = this.contactFieldList;
  }

  addInput(): void {
    var newGroup = this.formBuilder.group({
      categories: [''],
      employeeId: ['', Validators.maxLength(7)],
      employeeName: [''],
      empPhone: [''],
      empWork: [''],
      empHome: [''],
      empEmail: [''],
      empRole: [''],
      errorCount: 0,
    });
    this.arrayControl.push(newGroup);
  }

  delInput(index: number): void {
    this.arrayControl.removeAt(index);
  }

  onSubmit() {
    var payloadList = [];
    let errorCount = 0;
    for (var [j] of this.selectedRowsData.entries()) {
      for (var [i] of this.editForm.value.formArray.entries()) {
        if (this.editForm.value.formArray[i].employeeId !== null && this.editForm.value.formArray[i].employeeId
          !== "" && this.editForm.value.formArray[i].employeeId !== undefined) {
          var payload = new Object();
          payload["appId"] = this.selectedRowsData[j].id;
          payload["fieldId"] = this.editForm.value.formArray[i].categories.fieldId;
          payload["fieldValue"] = this.editForm.value.formArray[i].employeeId;
          payload["empId"] = this.dataSharingService.empId;
          errorCount = errorCount + this.editForm.value.formArray[i].errorCount;
          payloadList.push(payload);
        }
        else if(this.editForm.value.formArray[i].empEmail !== null && this.editForm.value.formArray[i].empEmail
          !== "" && this.editForm.value.formArray[i].empEmail !== undefined){
            errorCount = errorCount + this.editForm.value.formArray[i].errorCount;
        }
      }
    }
    if (errorCount === 0) {
      this.showErrorMsg = false;
      this.callEmployeeUpdate();
      const correlationID = uuid.v4();

      const httpOptions = {
        headers: new HttpHeaders({
          'X-MC-Correlation-ID': correlationID,
        }),
      };
      this.apiCallService.putData(environment.pulseUrl + environment.contactUrl, payloadList, httpOptions).subscribe(
        (data: any) => {
          if (data.success) {
            this.notificationService.open(NotificationConstants.NOTIFICATION_SUCCESS, "Application/s data updated succesfully!", 'Success', true, 5000);
          }
          else {
            this.notificationService.open(NotificationConstants.NOTIFICATION_ERROR, 'Failed to update application/s data!', 'Error', true, 5000);
          }
          this.closeBulkEditForm.emit(false);
        },
        (error) => {
          console.log("failed");
          this.notificationService.open(NotificationConstants.NOTIFICATION_ERROR, 'Failed to update application/s data! Try again later.', 'Error', true, 5000);
          this.closeBulkEditForm.emit(false);
        });
    }
    else {
      this.showErrorMsg = true;
    }
  }

  callEmployeeUpdate() {
    let employeePayloadList = [];
    for (var [k] of this.editForm.value.formArray.entries()) {
      if (this.editForm.value.formArray[k].employeeId !== null && this.editForm.value.formArray[k].employeeId
        !== "" && this.editForm.value.formArray[k].employeeId !== undefined && this.editForm.value.formArray[k].empEmail !== null && this.editForm.value.formArray[k].empEmail
        !== "" && this.editForm.value.formArray[k].empEmail !== undefined) {
        var payload1 = new Object();
        payload1["empId"] = this.editForm.value.formArray[k].employeeId;
        payload1["empName"] = this.editForm.value.formArray[k].employeeName;
        payload1["empRole"] = this.editForm.value.formArray[k].empRole;
        payload1["empEmail"] = this.editForm.value.formArray[k].empEmail;
        payload1["empPhone"] = this.editForm.value.formArray[k].empWork;
        payload1["empMobile"] = this.editForm.value.formArray[k].empHome;
        payload1["userId"] = this.dataSharingService.empId;
        employeePayloadList.push(payload1);
      }
    }
    this.updateEmpDetails(employeePayloadList);
  }

  updateEmpDetails(payloadList: any) {
    const correlationID = uuid.v4();
    const httpOptions = {
      headers: new HttpHeaders({
        'X-MC-Correlation-ID': correlationID,
      }),
    };
    this.apiCallService.putData(environment.pulseUrl + environment.fieldUrl, payloadList, httpOptions).subscribe(
      (data: any) => {
      },
      (error) => {
        console.log("failed");
      });
  }
}
