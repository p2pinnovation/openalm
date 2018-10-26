// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {Injectable, OnDestroy} from '@angular/core';
import {WorkPackageResource} from 'core-app/modules/hal/resources/work-package-resource';
import {Subject} from "rxjs";
import {ComponentType} from "@angular/cdk/portal";

@Injectable()
export class WorkPackageInlineCreateService implements OnDestroy {

  /**
   * A separate reference pane for the inline create component
   */
  public readonly referenceComponentClass:ComponentType<any>|null = null;

  /**
   * A related work package for the inline create context
   */
  public referenceTarget:WorkPackageResource|null = null;

  /**
   * Reference button text
   */
  public readonly referenceButtonText:string = '';

  /** Allow callbacks to happen on newly created inline work packages */
  public newInlineWorkPackageCreated = new Subject<string>();

  /** Allow callbacks to happen on newly created inline work packages */
  public newInlineWorkPackageReferenced = new Subject<string>();

  /**
   * Ensure hierarchical injected versions of this service correctly unregister
   */
  ngOnDestroy() {
    this.newInlineWorkPackageCreated.complete();
    this.newInlineWorkPackageReferenced.complete();
  }

}
