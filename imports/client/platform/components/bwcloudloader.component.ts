import {
    Component,
    Input,
    Output,
    EventEmitter
} from '@angular/core';
import { BWComponentBase } from '../../lib'


@Component({
    selector: 'bw-cloudloader',
    template: `
                <mat-card>
                    <mat-card-title>
                        <span>
                            {{label}}
                            <button mat-icon-button color="primary" matTooltip="Reset selected" (click) ="resetSelected($event)">
                                <i class="material-icons">autorenew</i>
                            </button>
                        </span>
                    </mat-card-title>
                    <mat-card-content>
                        <div class="scrollable-menu">
                            <bw-treeview [directories]="directories"
                                         (selectedItems)="onSelectedItems($event)"
                                         (openItem)="onOpenItem($event)"
                                         (previewItem)="onPreviewItem($event)"></bw-treeview>
                        </div>
                    </mat-card-content>
                    <mat-card-actions>
                        <button color="primary" mat-raised-button (click)="submit()">Download</button>
                        <span class="badge pull-right" *ngIf="_selectedItems.length > 0">{{_selectedItems.length}}</span>
                    </mat-card-actions>
                </mat-card>
`,

    styles: [`
        .scrollable-menu{
            overflow: scroll;
            height: 180px;
            max-height: 180px;
            white-space: nowrap;
        }
    `]

})

export class BWCloudLoader extends BWComponentBase{
    @Input()  directories = [];
    @Input()  label: string = "Your label here";
    @Output() selectedItems:  EventEmitter<any> = new EventEmitter();
    @Output() submittedItems: EventEmitter<any> = new EventEmitter();
    @Output() openItem:       EventEmitter<any> = new EventEmitter();
    @Output() previewItem:    EventEmitter<any> = new EventEmitter();

    private _selectedItems: Array = [];


    submit(){
        this.submittedItems.emit (this._selectedItems);
    }


    onSelectedItems (payload){
        this._selectedItems = payload.item;
        this.selectedItems.emit(payload.item);
    }


    onOpenItem (payload){
        this.openItem.emit(payload.item);
    }


    onPreviewItem (payload){
        this.previewItem.emit(payload.item);
    }


    resetSelected($event){
        for (let i = 0; i < this.directories.length; i++){
            this.directories[i].checked = false;
            this.checkRecursive(this.directories[i], false);
        }
        this.selectedItems.emit([]);
        $event.stopPropagation();
    }


    checkRecursive(item, state){
        if (item.children && item.children.length > 0){
            for (let i = 0; i < item.children.length; i++){
                item.children[i].checked = state;
                this.checkRecursive(item.children[i], state);
            }
        }
    };

}
