import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiegoComponent } from './riego.component';

describe('RiegoComponent', () => {
  let component: RiegoComponent;
  let fixture: ComponentFixture<RiegoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiegoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiegoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
