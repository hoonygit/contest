import React from 'react';

interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
}

const createLucideIcon = (iconName: string, svg: React.ReactElement[]) => {
  const Icon = React.forwardRef<SVGSVGElement, LucideIconProps>(
    ({ color = 'currentColor', size = 24, strokeWidth = 2, className, ...props }, ref) => (
      React.createElement('svg', {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: `lucide lucide-${iconName} ${className || ''}`,
        ...props,
      }, svg)
    )
  );
  Icon.displayName = iconName;
  return Icon;
};

export const BrainCircuit = createLucideIcon('brain-circuit', [
  React.createElement('path', { key: 1, d: 'M12 5a3 3 0 1 0-5.997.142' }),
  React.createElement('path', { key: 2, d: 'M18 5a3 3 0 1 0-5.997.142' }),
  React.createElement('path', { key: 3, d: 'M6.003 5.142A3 3 0 0 0 6 5' }),
  React.createElement('path', { key: 4, d: 'M12.003 5.142A3 3 0 0 0 12 5' }),
  React.createElement('path', { key: 5, d: 'M6 8.857v1.286' }),
  React.createElement('path', { key: 6, d: 'M12 8.857v1.286' }),
  React.createElement('path', { key: 7, d: 'M18 8.857v1.286' }),
  React.createElement('path', { key: 8, d: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' }),
  React.createElement('path', { key: 9, d: 'M12 12h.01' }),
  React.createElement('path', { key: 10, d: 'M6 12h.01' }),
  React.createElement('path', { key: 11, d: 'M18 12h.01' }),
  React.createElement('path', { key: 12, d: 'M6 15h.01' }),
  React.createElement('path', { key: 13, d: 'M12 15h.01' }),
  React.createElement('path', { key: 14, d: 'M18 15h.01' }),
]);

export const Mic = createLucideIcon('mic', [
  React.createElement('path', { key: 1, d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' }),
  React.createElement('path', { key: 2, d: 'M19 10v2a7 7 0 0 1-14 0v-2' }),
  React.createElement('line', { key: 3, x1: '12', x2: '12', y1: '19', y2: '22' }),
]);

export const Volume2 = createLucideIcon('volume-2', [
  React.createElement('polygon', { key: 1, points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }),
  React.createElement('path', { key: 2, d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }),
  React.createElement('path', { key: 3, d: 'M19.07 4.93a10 10 0 0 1 0 14.14' }),
]);

export const User = createLucideIcon('user', [
  React.createElement('path', { key: 1, d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }),
  React.createElement('circle', { key: 2, cx: '12', cy: '7', r: '4' }),
]);

export const Users = createLucideIcon('users', [
    React.createElement('path', { key: 1, d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    React.createElement('circle', { key: 2, cx: '9', cy: '7', r: '4' }),
    React.createElement('path', { key: 3, d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement('path', { key: 4, d: "M16 3.13a4 4 0 0 1 0 7.75" }),
]);

export const Bot = createLucideIcon('bot', [
    React.createElement('path', { key: 1, d: "M12 8V4H8" }),
    React.createElement('rect', { key: 2, width: "16", height: "12", x: "4", y: "8", rx: "2" }),
    React.createElement('path', { key: 3, d: "M2 14h2" }),
    React.createElement('path', { key: 4, d: "M20 14h2" }),
    React.createElement('path', { key: 5, d: "M15 13v2" }),
    React.createElement('path', { key: 6, d: "M9 13v2" }),
]);

export const Loader2 = createLucideIcon('loader-2', [
    React.createElement('path', { key: 1, d: "M21 12a9 9 0 1 1-6.219-8.56" }),
]);

export const Image = createLucideIcon('image', [
    React.createElement('rect', { key: 1, width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
    React.createElement('circle', { key: 2, cx: "9", cy: "9", r: "2" }),
    React.createElement('path', { key: 3, d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }),
]);

export const Download = createLucideIcon('download', [
  React.createElement('path', { key: 1, d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  React.createElement('polyline', { key: 2, points: '7 10 12 15 17 10' }),
  React.createElement('line', { key: 3, x1: '12', x2: '12', y1: '15', y2: '3' }),
]);

export const FileText = createLucideIcon('file-text', [
  React.createElement('path', { key: 1, d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
  React.createElement('polyline', { key: 2, points: '14 2 14 8 20 8' }),
  React.createElement('line', { key: 3, x1: '16', x2: '8', y1: '13', y2: '13' }),
  React.createElement('line', { key: 4, x1: '16', x2: '8', y1: '17', y2: '17' }),
  React.createElement('line', { key: 5, x1: '10', x2: '8', y1: '9', y2: '9' }),
]);

export const FileSpreadsheet = createLucideIcon('file-spreadsheet', [
  React.createElement('path', { key: 1, d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
  React.createElement('polyline', { key: 2, points: '14 2 14 8 20 8' }),
  React.createElement('path', { key: 3, d: 'M8 13h1v4' }),
  React.createElement('path', { key: 4, d: 'M15 13h1v4' }),
  React.createElement('path', { key: 5, d: 'M12 13h1v4' }),
  React.createElement('path', { key: 6, d: 'M8 13h8' }),
]);

export const PlayCircle = createLucideIcon('play-circle', [
    React.createElement('circle', { key: 1, cx: '12', cy: '12', r: '10' }),
    React.createElement('polygon', { key: 2, points: '10 8 16 12 10 16 10 8' }),
]);

export const BarChart2 = createLucideIcon('bar-chart-2', [
    React.createElement('line', { key: 1, x1: '18', x2: '18', y1: '20', y2: '10' }),
    React.createElement('line', { key: 2, x1: '12', x2: '12', y1: '20', y2: '4' }),
    React.createElement('line', { key: 3, x1: '6', x2: '6', y1: '20', y2: '14' }),
]);

export const AlertTriangle = createLucideIcon('alert-triangle', [
    React.createElement('path', { key: 1, d: 'm21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }),
    React.createElement('path', { key: 2, d: 'M12 9v4' }),
    React.createElement('path', { key: 3, d: 'M12 17h.01' }),
]);

export const CheckCircle = createLucideIcon('check-circle', [
    React.createElement('path', { key: 1, d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
    React.createElement('polyline', { key: 2, points: '22 4 12 14.01 9 11.01' }),
]);
