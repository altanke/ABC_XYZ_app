package com.attire.back.controller;

import com.attire.back.dto.ProductDto;
import com.attire.back.dto.ReviewDto;
import com.attire.back.dto.UserDto;
import com.attire.back.model.Product;
import com.attire.back.model.Review;
import com.attire.back.model.User;
import com.attire.back.service.ProductService;
import com.attire.back.service.ReviewService;
import com.attire.back.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// Импортируем ServletUriComponentsBuilder для создания URL
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByProductId(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        List<ReviewDto> reviewDtos = reviews.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviewDtos);
    }

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(@RequestBody ReviewDto reviewDto) {
        Optional<User> user = userService.findById(reviewDto.getUser().getId());
        Optional<Product> product = productService.findById(reviewDto.getProduct().getId());

        if (user.isPresent() && product.isPresent()) {
            Review review = new Review(user.get(), product.get(), reviewDto.getRating(), reviewDto.getContent());
            Review savedReview = reviewService.saveReview(review);
            return new ResponseEntity<>(mapToDto(savedReview), HttpStatus.CREATED);
        }
        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
    }

    private ReviewDto mapToDto(Review review) {
        UserDto userDto = new UserDto(review.getUser().getId(), review.getUser().getUsername(), review.getUser().getEmail());

        // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
        // Получаем сущность Product
        Product product = review.getProduct();
        String imageUrl = null;

        if (product.getImageFileName() != null && !product.getImageFileName().isBlank()) {
            imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/images/")
                    .path(product.getImageFileName())
                    .toUriString();
        }

        ProductDto productDto = new ProductDto(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getDescription(),
                product.getCategory(),
                imageUrl
        );

        return new ReviewDto(review.getId(), userDto, productDto, review.getRating(), review.getContent());
    }
}