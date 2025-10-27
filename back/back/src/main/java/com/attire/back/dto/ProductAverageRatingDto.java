package com.attire.back.dto;

public class ProductAverageRatingDto {
    private Long productId;
    private String productName;
    private Double averageRating;
    private Long reviewCount;

    public ProductAverageRatingDto(Long productId, String productName, Double averageRating, Long reviewCount) {
        this.productId = productId;
        this.productName = productName;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public Long getReviewCount() {
        return reviewCount;
    }
}