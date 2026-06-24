#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub category: Symbol,
    pub amount: i128,
    pub note: Symbol,
    pub timestamp: u64,
}

#[contract]
pub struct PaymentLogger;

#[contractimpl]
impl PaymentLogger {
    pub fn log_payment(env: Env, sender: Address, category: Symbol, amount: i128, note: Symbol) {
        sender.require_auth();

        let mut logs: Vec<PaymentRecord> = env.storage().persistent().get(&sender).unwrap_or(Vec::new(&env));
        let record = PaymentRecord {
            category: category.clone(),
            amount,
            note: note.clone(),
            timestamp: env.ledger().timestamp(),
        };
        logs.push_back(record);
        env.storage().persistent().set(&sender, &logs);

        let category_key = (sender.clone(), category.clone());
        let mut total: i128 = env.storage().persistent().get(&category_key).unwrap_or(0);
        total += amount;
        env.storage().persistent().set(&category_key, &total);

        env.events().publish((Symbol::new(&env, "PaymentLogged"), sender), (category, amount, note));
    }

    pub fn get_payment_log(env: Env, sender: Address) -> Vec<PaymentRecord> {
        env.storage().persistent().get(&sender).unwrap_or(Vec::new(&env))
    }

    pub fn get_total_by_category(env: Env, sender: Address, category: Symbol) -> i128 {
        let category_key = (sender, category);
        env.storage().persistent().get(&category_key).unwrap_or(0)
    }
}
