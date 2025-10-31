// Файл: ReviewDto.java
package com.attire.back.dto;

public class ReviewDto {
    private Long id;
    private UserDto user; // Должен быть UserDto
    private ProductDto product;
    private int rating;
    private String content;

    public ReviewDto() {}

    // Конструктор должен принимать UserDto
    public ReviewDto(Long id, UserDto user, ProductDto product, int rating, String content) {
        this.id = id;
        this.user = user;
        this.product = product;
        this.rating = rating;
        this.content = content;
    }

    // --- Геттеры и Сеттеры ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDto getUser() { // Должен возвращать UserDto
        return user;
    }

    public void setUser(UserDto user) { // Должен принимать UserDto
        this.user = user;
    }

    public ProductDto getProduct() {
        return product;
    }

    public void setProduct(ProductDto product) {
        this.product = product;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}