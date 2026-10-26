import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Mock data for reports
const VISITOR_DATA = [
  { date: '2023-10-27', visitor: 'Arun Selvam', host: 'Dr. Priya Sharma', dept: 'HR', status: 'Checked Out' },
  { date: '2023-10-27', visitor: 'Kavitha Rajan', host: 'Mr. Rajan Kumar', dept: 'Engineering', status: 'Pending' },
  { date: '2023-10-26', visitor: 'Muthu Krishnan', host: 'Ms. Anita Nair', dept: 'Finance', status: 'Checked Out' },
  { date: '2023-10-26', visitor: 'Preethi S', host: 'Dr. Kumar V', dept: 'IT', status: 'Approved' },
];

export default function AdminReports() {
  const { addToast } = useToast();
  const [reportType, setReportType] = useState('Daily');
  const [exportFormat, setExportFormat] = useState('PDF');
  
  const handleGenerate = () => {
    try {
      if (exportFormat === 'PDF') {
        const doc = new jsPDF();
        doc.text(`Visitor ${reportType} Report`, 14, 15);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
        
        const tableColumn = ["Date", "Visitor Name", "Host", "Department", "Status"];
        const tableRows = VISITOR_DATA.map(v => [v.date, v.visitor, v.host, v.dept, v.status]);
        
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
        
        doc.save(`Visitor_${reportType}_Report.pdf`);
        addToast(`Successfully exported ${reportType} report as PDF!`, 'success');
      } else if (exportFormat === 'Excel') {
        const worksheet = XLSX.utils.json_to_sheet(VISITOR_DATA);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `Visitor_${reportType}_Report.xlsx`);
        addToast(`Successfully exported ${reportType} report as Excel!`, 'success');
      } else if (exportFormat === 'CSV') {
        const worksheet = XLSX.utils.json_to_sheet(VISITOR_DATA);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Visitor_${reportType}_Report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`Successfully exported ${reportType} report as CSV!`, 'success');
      }
    } catch (err) {
      addToast('Failed to generate report', 'error');
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Generate and export detailed data summaries.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '24px' }}>Generate Report</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Report Type</label>
              <select className="form-input" value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="Daily">Daily Report</option>
                <option value="Weekly">Weekly Report</option>
                <option value="Monthly">Monthly Report</option>
                <option value="Department">Department Report</option>
                <option value="Host">Host Report</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Export Format</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['PDF', 'Excel', 'CSV'].map(fmt => (
                  <label key={fmt} style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '12px 20px', border: '1px solid var(--border)', 
                    borderRadius: '8px', cursor: 'pointer', flex: 1,
                    background: exportFormat === fmt ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderColor: exportFormat === fmt ? 'var(--accent-1)' : 'var(--border)'
                  }}>
                    <input 
                      type="radio" name="format" value={fmt} 
                      checked={exportFormat === fmt} 
                      onChange={() => setExportFormat(fmt)}
                      style={{ margin: 0 }}
                    />
                    {fmt}
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem', marginTop: '12px' }}
              onClick={handleGenerate}
            >
              Generate & Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
