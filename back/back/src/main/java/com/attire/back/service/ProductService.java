package com.attire.back.service;

import com.attire.back.model.Product;
import com.attire.back.repository.CartItemRepository; // <--- Добавь импорт
import com.attire.back.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <--- Добавь импорт

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAllByIsActiveTrue();
    }

    public Optional<Product> findById(Long id) {
        return productRepository.findByIdAndIsActiveTrue(id);
    }

    public Optional<Product> findProductByIdForAdmin(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Optional<Product> productOpt = productRepository.findById(id);

        if (productOpt.isPresent()) {
            Product product = productOpt.get();

            cartItemRepository.deleteByProductId(id);


            product.setActive(false);
            productRepository.save(product);
        }
    }
}