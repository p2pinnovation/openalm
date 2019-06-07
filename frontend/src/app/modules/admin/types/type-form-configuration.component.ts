import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {TypeBannerService} from 'core-app/modules/admin/types/type-banner.service';
import {I18nService} from 'core-app/modules/common/i18n/i18n.service';
import {NotificationsService} from 'core-app/modules/common/notifications/notifications.service';
import {ExternalRelationQueryConfigurationService} from 'core-components/wp-table/external-configuration/external-relation-query-configuration.service';
import {DomAutoscrollService} from 'core-app/modules/common/drag-and-drop/dom-autoscroll.service';
import {DragulaService} from 'ng2-dragula';
import {ConfirmDialogService} from 'core-components/modals/confirm-dialog/confirm-dialog.service';
import {Drake} from 'dragula';

import {randomString} from 'core-app/helpers/random-string';
import {GonService} from "core-app/modules/common/gon/gon.service";
import {DynamicBootstrapper} from "core-app/globals/dynamic-bootstrapper";
import {takeUntil} from "rxjs/operators";
import {componentDestroyed} from "ng2-rx-componentdestroyed";

export type TypeGroupType = 'attribute'|'query';

export interface TypeFormAttribute {
  key:string;
  translation:string;
  is_cf:boolean;
}

export interface TypeGroup {
  key:string;
  static_key:boolean;
  attributes:TypeFormAttribute[];
  query?:any;
  type:TypeGroupType;
}

@Component({
  selector: 'admin-type-form-configuration',
  templateUrl: './type-form-configuration.html',
  providers: [
    TypeBannerService,
  ]
})
export class TypeFormConfigurationComponent implements OnInit, OnDestroy {

  public text = {
    drag_to_activate: this.I18n.t('js.admin.type_form.drag_to_activate'),
    reset: this.I18n.t('js.admin.type_form.reset'),
    label_group: this.I18n.t('js.label_group'),
    label_inactive: this.I18n.t('js.admin.type_form.inactive'),
    custom_field: this.I18n.t('js.admin.type_form.custom_field'),
    add_group: this.I18n.t('js.admin.type_form.add_group'),
    add_table: this.I18n.t('js.admin.type_form.add_table'),
  };

  private autoscroll:any;
  private element:HTMLElement;
  private form:JQuery;

  public groups:TypeGroup[] = [];
  public inactives:TypeFormAttribute[] = [];

  private attributeDrake:Drake;
  private groupsDrake:Drake;

  private no_filter_query = this.Gon.get('no_filter_query');

  constructor(private elementRef:ElementRef,
              private I18n:I18nService,
              private Gon:GonService,
              private dragula:DragulaService,
              private confirmDialog:ConfirmDialogService,
              private notificationsService:NotificationsService,
              private externalRelationQuery:ExternalRelationQueryConfigurationService) {
  }

  ngOnInit():void {
    // Hook on form submit
    this.element = this.elementRef.nativeElement;
    this.form = jQuery(this.element).closest('form');
    this.form.on('submit.typeformupdater', () => {
      return !this.updateHiddenFields();
    });

    // Setup groups
    this.dragula.createGroup('groups', {
      moves: (el, source, handle:HTMLElement) => handle.classList.contains('group-handle')
    });

    // Setup attributes
    this.dragula.createGroup('attributes', {
      moves: (el, source, handle:HTMLElement) => handle.classList.contains('attribute-handle')
    });

    this.dragula.dropModel("attributes")
      .pipe(
        takeUntil(componentDestroyed(this))
      )
      .subscribe((event) => {
        console.log(event);
      });

    // Get attribute id
    this.groups = JSON.parse(this.element.dataset.activeGroups!);
    this.inactives = JSON.parse(this.element.dataset.inactiveAttributes!);

    // Setup autoscroll
    const that = this;
    this.autoscroll = new DomAutoscrollService(
      [
        document.getElementById('content-wrapper')!
      ],
      {
        margin: 25,
        maxSpeed: 10,
        scrollWhenOutside: true,
        autoScroll: function (this:any) {
          const groups = that.groupsDrake && that.groupsDrake.dragging;
          const attributes = that.attributeDrake && that.attributeDrake.dragging;
          return this.down && (groups || attributes);
        }
      });
  }

  ngOnDestroy() {
    // Nothing to do
  }

  public deactivateAttribute(attribute:TypeFormAttribute) {
    this.updateInactives(this.inactives.concat(attribute));
  }

  public addGroupAndOpenQuery():void {
    let newGroup = this.createGroup('query');
    this.editQuery(newGroup);
  }

  public editQuery(group:TypeGroup) {
    // Disable display mode and timeline for now since we don't want users to enable it
    const disabledTabs = {
      'display-settings': I18n.t('js.work_packages.table_configuration.embedded_tab_disabled'),
      'timelines': I18n.t('js.work_packages.table_configuration.embedded_tab_disabled')
    };

    this.externalRelationQuery.show(
      group.query,
      (queryProps:any) => group.query = queryProps,
      disabledTabs
    );
  }

  public deleteGroup(group:TypeGroup) {
    this.updateInactives(this.inactives.concat(group.attributes));
    this.groups = this.groups.filter(el => el !== group);

    return group;
  }

  public extractQuery(originator:JQuery) {
    // When the query has never been edited, the query props are stringified in the query dataset
    let persistentQuery = originator.data('query');
    // When the user edited the query at least once, the up-to-date query is persisted in queryProps dataset
    let currentQuery = originator.data('queryProps');

    return currentQuery || persistentQuery || undefined;
  }

  public createGroup(type:TypeGroupType, groupName:string = '') {
    let randomId:string = randomString(8);

    let group:TypeGroup = {
      type: type,
      key: randomId,
      static_key: false,
      attributes: [],
    };

    this.groups.unshift(group);
    return group;
  }

  public resetToDefault($event:Event):boolean {
    this.confirmDialog
      .confirm({
        text: {
          title: this.I18n.t('js.types.attribute_groups.reset_title'),
          text: this.I18n.t('js.types.attribute_groups.confirm_reset'),
          button_continue: this.I18n.t('js.label_reset')
        }
      }).then(() => {
      this.form.find('input#type_attribute_groups').val(JSON.stringify([]));

      // Disable our form handler that updates the attribute groups
      this.form.off('submit.typeformupdater');
      this.form.trigger('submit');
    });

    $event.preventDefault();
    return false;
  }

  private updateInactives(newValue:TypeFormAttribute[]) {
    this.inactives = [...newValue].sort((a, b) => a.translation.localeCompare(b.translation));
  }
}

DynamicBootstrapper.register({cls: TypeFormConfigurationComponent, selector: 'admin-type-form-configuration'});
