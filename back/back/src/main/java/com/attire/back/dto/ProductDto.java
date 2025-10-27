package com.attire.back.dto;

public class ProductDto {
    private Long id;
    private String name;
    private double price;
    private String description;
    private String category;
    private String imageUrl;

    public ProductDto(Long id, String name, double price, String description, String category, String imageUrl) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.category = category;
        this.imageUrl = imageUrl;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getPrice() {
        return price;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getImageUrl() {
        return imageUrl;
    }
}
