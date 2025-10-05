// Simple test to verify Jest setup is working
describe('Simple Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should work with strings', () => {
    expect('hello').toBe('hello');
  });

  test('should work with arrays', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });
});