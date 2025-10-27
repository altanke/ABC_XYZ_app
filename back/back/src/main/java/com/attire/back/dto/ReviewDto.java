package com.attire.back.dto;

public class ReviewDto {
    private Long id;
    private String content;
    private int rating;
    private UserDto user;
    private ProductDto product;

    public ReviewDto(Long id, String content, int rating, UserDto user, ProductDto product) {
        this.id = id;
        this.content = content;
        this.rating = rating;
        this.user = user;
        this.product = product;
    }

    public Long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public int getRating() {
        return rating;
    }

    public UserDto getUser() {
        return user;
    }

    public ProductDto getProduct() {
        return product;
    }
}
