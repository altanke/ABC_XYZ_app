package com.attire.back.repository;

import com.attire.back.model.Product;
import com.attire.back.dto.CategoryProductCountDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional; // <--- Добавь импорт

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT new com.attire.back.dto.CategoryProductCountDto(p.category, COUNT(p)) FROM Product p GROUP BY p.category")
    List<CategoryProductCountDto> countProductsByCategory();


    List<Product> findAllByIsActiveTrue();

    Optional<Product> findByIdAndIsActiveTrue(Long id);
}