package com.attire.back.dto;

import java.math.BigDecimal;

public class AbcXyzReportDto {
    private ProductDto product;
    private BigDecimal totalRevenue;
    private double revenueSharePercentage;
    private String abcClass;
    private double coefficientOfVariation;
    private String xyzClass;
    private String combinedClass;

    public AbcXyzReportDto(ProductDto product) {
        this.product = product;
        this.totalRevenue = BigDecimal.ZERO;
        this.revenueSharePercentage = 0.0;
        this.abcClass = "C"; // По умолчанию C
        this.coefficientOfVariation = 0.0;
        this.xyzClass = "Z"; // По умолчанию Z
        this.combinedClass = "CZ";
    }

    // Геттеры и Сеттеры

    public ProductDto getProduct() {
        return product;
    }

    public void setProduct(ProductDto product) {
        this.product = product;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public double getRevenueSharePercentage() {
        return revenueSharePercentage;
    }

    public void setRevenueSharePercentage(double revenueSharePercentage) {
        this.revenueSharePercentage = revenueSharePercentage;
    }

    public String getAbcClass() {
        return abcClass;
    }

    public void setAbcClass(String abcClass) {
        this.abcClass = abcClass;
    }

    public double getCoefficientOfVariation() {
        return coefficientOfVariation;
    }

    public void setCoefficientOfVariation(double coefficientOfVariation) {
        this.coefficientOfVariation = coefficientOfVariation;
    }

    public String getXyzClass() {
        return xyzClass;
    }

    public void setXyzClass(String xyzClass) {
        this.xyzClass = xyzClass;
    }

    public String getCombinedClass() {
        return combinedClass;
    }

    public void setCombinedClass(String combinedClass) {
        this.combinedClass = combinedClass;
    }
}