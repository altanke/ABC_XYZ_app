package com.attire.back.controller;

import com.attire.back.dto.ProductAverageRatingDto;
import com.attire.back.dto.CategoryProductCountDto;
import com.attire.back.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;


    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummaryReport() {
        Map<String, Object> summary = reportService.getSummaryReport();
        return ResponseEntity.ok(summary);
    }


    @GetMapping("/average-product-ratings")
    public ResponseEntity<List<ProductAverageRatingDto>> getAverageProductRatings() {
        List<ProductAverageRatingDto> ratings = reportService.getAverageProductRatings();
        return ResponseEntity.ok(ratings);
    }


    @GetMapping("/products-by-category")
    public ResponseEntity<List<CategoryProductCountDto>> getProductsByCategoryReport() {
        List<CategoryProductCountDto> productCounts = reportService.getProductsByCategory();
        return ResponseEntity.ok(productCounts);
    }


}