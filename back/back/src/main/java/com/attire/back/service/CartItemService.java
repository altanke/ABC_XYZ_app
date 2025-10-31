package com.attire.back.service;

import com.attire.back.model.CartItem;
import com.attire.back.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <--- Добавь импорт

import java.util.List;
import java.util.Optional;

@Service
public class CartItemService {

    @Autowired
    private CartItemRepository cartItemRepository;

    public List<CartItem> getCartItemsByUserId(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public CartItem saveCartItem(CartItem cartItem) {
        return cartItemRepository.save(cartItem);
    }

    @Transactional // <--- Добавь аннотацию
    public void deleteCartItemsByUserId(Long userId) {
        // Оставим эту логику как есть, если она нужна для OrderService
        List<CartItem> cartItems = getCartItemsByUserId(userId);
        for (CartItem cartItem : cartItems) {
            cartItemRepository.delete(cartItem);
        }
        // Или можно использовать: cartItemRepository.deleteByUserId(userId);
        // если такой метод есть в репозитории и он помечен @Transactional
    }

    // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
    // Метод теперь принимает Long id
    public void deleteCartItem(Long cartItemId) {
        // Проверяем, существует ли элемент перед удалением (опционально, но безопасно)
        if (!cartItemRepository.existsById(cartItemId)) {
            // Можно выбросить исключение или просто ничего не делать
            System.err.println("CartItem with id " + cartItemId + " not found for deletion.");
            return;
            // throw new EntityNotFoundException("CartItem not found with id: " + cartItemId);
        }
        cartItemRepository.deleteById(cartItemId); // Используем стандартный метод JpaRepository
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---


    public Optional<CartItem> findById(Long id) {
        return cartItemRepository.findById(id);
    }

    public Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId) {
        return cartItemRepository.findByUserIdAndProductId(userId, productId);
    }
}