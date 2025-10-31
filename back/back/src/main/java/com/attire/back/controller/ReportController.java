package com.attire.back.controller;

import com.attire.back.dto.AbcXyzReportDto;
import com.attire.back.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; // Импортируем RequestParam
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/abc-xyz-analysis")
    public ResponseEntity<List<AbcXyzReportDto>> getAbcXyzAnalysisReport(
            @RequestParam(value = "months", required = false, defaultValue = "12") int months) {

        List<AbcXyzReportDto> report = reportService.getAbcXyzAnalysis(months);
        return ResponseEntity.ok(report);
    }
}