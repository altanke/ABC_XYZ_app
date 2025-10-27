package com.attire.back.dto;

public class CategoryProductCountDto {
    private String category;
    private Long productCount;

    public CategoryProductCountDto(String category, Long productCount) {
        this.category = category;
        this.productCount = productCount;
    }

    public String getCategory() {
        return category;
    }

    public Long getProductCount() {
        return productCount;
    }
}