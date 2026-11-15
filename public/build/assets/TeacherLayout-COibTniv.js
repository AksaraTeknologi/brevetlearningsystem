import{j as a}from"./app-09O0sIs4.js";import{S as t}from"./StaffShell-BLIYmXS6.js";import{H as r,S as o}from"./sheet-CFyvvf49.js";import{U as s}from"./users-CMFlMZzt.js";import{c}from"./createLucideIcon-DC446u-k.js";/**
 * @license lucide-react v0.474.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],n=c("Database",i),l=()=>[{category:"Menu",items:[{title:"Dashboard",url:route("teacher.dashboard"),icon:r},{title:"Daftar Peserta",url:route("teacher.participants"),icon:s},{title:"Daftar Kelas",url:route("teacher.courses"),icon:o},{title:"Bank Soal",url:route("teacher.questionBanks"),icon:n}]}];function f({children:e}){return a.jsx(t,{roleLabel:"Pengajar",menu:l(),dashboardRoute:"teacher.dashboard",dashboardPaths:["/teacher","/teacher/dashboard"],children:e})}export{n as D,f as T};
