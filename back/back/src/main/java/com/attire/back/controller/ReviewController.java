package com.attire.back.controller;

import com.attire.back.dto.ReviewDto;
import com.attire.back.dto.UserDto;
import com.attire.back.dto.ProductDto;
import com.attire.back.model.Review;
import com.attire.back.model.User;
import com.attire.back.model.Product;
import com.attire.back.service.ReviewService;
import com.attire.back.service.UserService;
import com.attire.back.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{productId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByProductId(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        List<ReviewDto> reviewDtos = reviews.stream()
                .map(review -> new ReviewDto(
                        review.getId(),
                        review.getContent(),
                        review.getRating(),
                        new UserDto(
                                review.getUser().getId(),
                                review.getUser().getUsername(),
                                review.getUser().getEmail()
                        ),
                        new ProductDto(
                                review.getProduct().getId(),
                                review.getProduct().getName(),
                                review.getProduct().getPrice(),
                                review.getProduct().getDescription(),
                                review.getProduct().getCategory(),
                                review.getProduct().getImageUrl()
                        )
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviewDtos);
    }

    @PostMapping
    public ResponseEntity<ReviewDto> addReview(@RequestBody Review review) {
        // Проверяем наличие пользователя
        if (review.getUser() == null || review.getUser().getId() == null) {
            return ResponseEntity.badRequest().body(null); // Некорректные данные пользователя
        }

        // Проверяем наличие продукта
        if (review.getProduct() == null || review.getProduct().getId() == null) {
            return ResponseEntity.badRequest().body(null); // Некорректные данные продукта
        }

        // Загружаем пользователя и продукт из базы
        Optional<User> user = userService.findById(review.getUser().getId());
        Optional<Product> product = productService.findById(review.getProduct().getId());

        if (user.isEmpty() || product.isEmpty()) {
            return ResponseEntity.badRequest().body(null); // Пользователь или продукт не найден
        }

        // Заполняем объект Review
        review.setUser(user.get());
        review.setProduct(product.get());

        // Сохраняем отзыв
        Review savedReview = reviewService.saveReview(review);

        // Формируем DTO для ответа
        ReviewDto response = new ReviewDto(
                savedReview.getId(),
                savedReview.getContent(),
                savedReview.getRating(),
                new UserDto(
                        savedReview.getUser().getId(),
                        savedReview.getUser().getUsername(),
                        savedReview.getUser().getEmail()
                ),
                new ProductDto(
                        savedReview.getProduct().getId(),
                        savedReview.getProduct().getName(),
                        savedReview.getProduct().getPrice(),
                        savedReview.getProduct().getDescription(),
                        savedReview.getProduct().getCategory(),
                        savedReview.getProduct().getImageUrl()
                )
        );

        return ResponseEntity.status(201).body(response);
    }
}
