package com.attire.back.repository;

import com.attire.back.model.Review;
import com.attire.back.dto.ProductAverageRatingDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductId(Long productId);

    @Query("SELECT new com.attire.back.dto.ProductAverageRatingDto(r.product.id, r.product.name, AVG(r.rating), COUNT(r)) FROM Review r GROUP BY r.product.id, r.product.name")
    List<ProductAverageRatingDto> findAverageRatingPerProduct();
}
