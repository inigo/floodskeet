import { Formatter } from './Formatter';
import { StationData, WaterLevel } from './types';  // Assuming we've moved types to a separate file

describe('Formatter', () => {
  const formatter = new Formatter();
  const testStation: StationData = {
    riverName: 'Test',
    typicalHigh: 2.0,
    typicalLow: 1.0,
    minLevel: 0.75,
    stationName: 'TestStation',
    maxLevel: 3.0,
    warningLevel: 2.75
  };

  // Helper function to create a formatted message
  const fmt = (measurements: WaterLevel[]): string =>
    formatter.formatMessage(testStation, measurements);

  // Helper function to create a measurement
  const meas = (height: number): WaterLevel => ({
    timestamp: new Date(),
    height,
  });

  describe('formatting no measurements', () => {
    it('should include the station name', () => {
      expect(fmt([])).toContain('Test');
    });
  });

  describe('formatting a single measurement', () => {
    it('should report a high river', () => {
      expect(fmt([meas(2.1)])).toContain('RIVER HIGH');
    });

    it('should report a very high river', () => {
      expect(fmt([meas(3.0)])).toContain('RIVER VERY HIGH');
    });

    it('should contain the river level', () => {
      expect(fmt([meas(2.1)])).toContain('2.10 m');
    });

    it('should cope with zeroes', () => {
      const zeroMeasurement: WaterLevel = {
        timestamp: new Date(),
        height: 1.2,
      };
      expect(fmt([zeroMeasurement])).toContain('1.20 m');
    });
  });

  describe('formatting two measurements', () => {
    it('should report a high river based on the last measurement', () => {
      expect(fmt([meas(1.0), meas(2.1)])).toContain('RIVER HIGH');
    });

    it('should contain the current level', () => {
      expect(fmt([meas(1.0), meas(2.1)])).toContain('2.10 m');
    });

    it('should contain the previous level', () => {
      expect(fmt([meas(1.0), meas(2.1)])).toContain('1.00 m');
    });

    it('should indicate the level is rising', () => {
      expect(fmt([meas(1.0), meas(2.1)])).toContain('↑');
    });

    it('should indicate the level is falling', () => {
      expect(fmt([meas(2.2), meas(2.1)])).toContain('↓');
    });

    it('should indicate the level is stable', () => {
      expect(fmt([meas(2.2), meas(2.2)])).toContain('stable');
    });
  });

  describe('formatting three measurements', () => {
    it('should report a high river based on the last measurement', () => {
      expect(fmt([meas(1.0), meas(2.1), meas(2.2)])).toContain('RIVER HIGH');
    });

    it('should contain the current level', () => {
      expect(fmt([meas(1.0), meas(2.1), meas(2.2)])).toContain('2.20 m');
    });

    it('should contain the previous level', () => {
      expect(fmt([meas(1.0), meas(2.1), meas(2.2)])).toContain('2.10 m');
    });

    it('should contain a sparkline', () => {
      expect(fmt([meas(1.0), meas(2.5), meas(3.0)])).toContain('▂▅▇');
    });
  });

  describe('calculating height percentages', () => {
    // Using Jest's built-in matchers for number comparisons
    it('should return subzero for levels in the typical band', () => {
      expect(formatter['percentageAboveNormal'](testStation, meas(1.0))).toBeLessThan(0.0);
    });

    it('should return greater than 1 for very very high levels', () => {
      expect(formatter['percentageAboveNormal'](testStation, meas(5.0))).toBeGreaterThan(1.0);
    });

    it('should return expected values for intermediate levels', () => {
      expect(formatter['percentageAboveNormal'](testStation, meas(2.5))).toBe(0.5);
    });
  });

  describe('creating sparklines', () => {
    it('should return ▂ for low values', () => {
      expect(formatter['toBlock'](-1.0)).toBe('▂');
    });

    it('should return ▇ for high values', () => {
      expect(formatter['toBlock'](2.0)).toBe('▇');
    });

    it('should return ▅ for halfway values', () => {
      expect(formatter['toBlock'](0.5)).toBe('▅');
    });
  });
});