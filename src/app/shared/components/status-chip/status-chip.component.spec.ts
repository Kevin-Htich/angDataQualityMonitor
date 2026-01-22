import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let fixture: ComponentFixture<StatusChipComponent>;
  let component: StatusChipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusChipComponent);
    component = fixture.componentInstance;
  });

  it('renders healthy class when status is Healthy', () => {
    component.status = 'Healthy';
    fixture.detectChanges();
    const chip: HTMLElement = fixture.nativeElement.querySelector('mat-chip');
    expect(chip.classList.contains('chip-healthy')).toBeTrue();
  });
});
