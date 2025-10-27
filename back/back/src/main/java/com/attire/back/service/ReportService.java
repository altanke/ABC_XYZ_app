package com.attire.back.service;

import com.attire.back.dto.ProductAverageRatingDto;
import com.attire.back.dto.CategoryProductCountDto;
import com.attire.back.repository.OrderRepository;
import com.attire.back.repository.UserRepository;
import com.attire.back.repository.ProductRepository;
import com.attire.back.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;



    public Map<String, Object> getSummaryReport() {
        Map<String, Object> summary = new HashMap<>();

        long orderCount = orderRepository.count();
        summary.put("orderCount", orderCount);


        Double totalRevenue = orderRepository.findAll().stream()
                .mapToDouble(order -> order.getTotalPrice())
                .sum();
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);


        long userCount = userRepository.count();
        summary.put("userCount", userCount);

        long productCount = productRepository.count();
        summary.put("productCount", productCount);

        long reviewCount = reviewRepository.count();
        summary.put("reviewCount", reviewCount);


        return summary;
    }


    public List<ProductAverageRatingDto> getAverageProductRatings() {
        return reviewRepository.findAverageRatingPerProduct();
    }


    public List<CategoryProductCountDto> getProductsByCategory() {
        return productRepository.countProductsByCategory();
    }


}