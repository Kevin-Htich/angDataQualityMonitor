import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  it('formats minutes ago', () => {
    const pipe = new RelativeTimePipe();
    const date = new Date(Date.now() - 5 * 60000);
    expect(pipe.transform(date)).toContain('5m');
  });
});
