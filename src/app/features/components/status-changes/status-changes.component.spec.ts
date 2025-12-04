import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusChangesComponent } from './status-changes.component';

describe('StatusChangesComponent', () => {
  let component: StatusChangesComponent;
  let fixture: ComponentFixture<StatusChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChangesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
