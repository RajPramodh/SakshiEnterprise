import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ApplicationContactTable, ContactField } from 'src/app/core/services/model.service';
import { trigger, transition, animate, style } from '@angular/animations';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ApiCallService } from 'src/app/core/services/api-call.service';
import { ContactInfoComponent } from '../contact-info/contact-info.component';

@Component({
  selector: '[pulse-contact-table-rows]',
  templateUrl: './contact-table-rows.component.html',
  styleUrls: ['./contact-table-rows.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-15%)', opacity: 0 }),
        animate('0.75s ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.75s ease-in', style({ transform: 'translateX(-15%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ContactTableRowsComponent implements OnInit, OnChanges {

  @ViewChild(ContactInfoComponent, { static: false })
  contactInfoComponent: ContactInfoComponent;

  @Output() rowSelected = new EventEmitter<ApplicationContactTable>();
  @Output() rowUnSelected = new EventEmitter<ApplicationContactTable>();
  @Output() onSelectAppln = new EventEmitter<boolean>()

  @Input() applicationContactTablelist: ApplicationContactTable[];
  @Input() contactFieldList: ContactField[] = [];

  data: ApplicationContactTable[] = [];
  infoFormErrorMsg = false;

  constructor(private readonly apiCallService: ApiCallService, private readonly changeDetectorRef: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.data = [];
    this.data = this.applicationContactTablelist;
  }

  ngOnInit(): void {
  }

  onSelectRow(selectedRow: any, eventStatus: any) {
    if (eventStatus) {
      selectedRow.isSelected = true;
      this.rowSelected.emit(selectedRow);
    }
    else {
      selectedRow.isSelected = false;
      this.rowUnSelected.emit(selectedRow);
    }
  }

  onSelectApplication(application: ApplicationContactTable) {
    this.onSelectAppln.emit(false);
    this.infoFormErrorMsg = false;
    this.data.forEach((item) => {
      if ((item.showApplnInfo === true && item.id !== application.id)) {
        item.showApplnInfo = false;
      }
    });
    const correlationID = uuid.v4();
    const httpOptions = {
      headers: new HttpHeaders({
        'X-MC-Correlation-ID': correlationID,
      }),
    };
    const url = `?applicationId=${application.id}`
    this.apiCallService.getData(environment.pulseUrl + environment.contactUrl + url, httpOptions).subscribe(
      (data: any) => {
        application.showApplnInfo = true;
        application.enableEditForm = false;
        if ( data.responseData[application.id.toString()] !== undefined && data.responseData[application.id.toString()] !== null) {
          application.applicationDetails = data.responseData[application.id.toString()];
          const item = data.responseData[application.id.toString()].reduce((prev, current) => (+prev.lastUpdatedDate > +current.lastUpdatedDate) ? prev : current)
          var upadtedDate = moment(item.lastUpdatedDate).format('MMMM Do YYYY, H:mm:ss');
          application.lstUpdtDttm = upadtedDate;
          application.lstUpdtUserId = item.lastUpdatedUserId;
          
        }
        else{
          application.lstUpdtDttm = 'NA';
          application.lstUpdtUserId = 'NA';
          application.applicationDetails = [];
        }
        this.changeDetectorRef.detectChanges();
      },
      (error) => {
        console.log("failed");
      });
  }

  closeApplnInfo(application: any) {
    application.showApplnInfo = false;
  }

  onEditApplicationContactInfo(application: ApplicationContactTable) {
    application.enableEditForm = true;
    this.contactInfoComponent.onEditInfo();
  }

  onSubmitApplicationContactInfo(application: ApplicationContactTable) {
    this.contactInfoComponent.onSubmitInfo();
  }

  onCancelEdit(application: ApplicationContactTable) {
    this.infoFormErrorMsg = false;
    application.enableEditForm = false;
    this.contactInfoComponent.onCancelEdit();
  }

  onShowErrorMessage(value: boolean) {
    this.infoFormErrorMsg = true;
  }

}
